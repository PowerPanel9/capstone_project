// agentClient.mjs
// This module is the "brain" that connects Claude (via OpenAI-compatible gateway) to your MCP server.
//
// Big picture of the request flow:
//   AIAgentModal (browser)
//     -> POST /api/agent/chat            (Express route + controller)
//       -> runAgent() in THIS file:
//            1. launches your MCP server (server.mjs) as a child process
//            2. asks it for its tools (search_listings, create_listing, ...)
//            3. sends the user's message to Claude WITH those tools
//            4. whenever Claude wants a tool, we run it through the MCP server
//               and hand the result back, looping until Claude has an answer
//
// This file is ESM (`import`) because the OpenAI SDK and MCP client SDK are ES modules.

import OpenAI from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Work out where server.mjs lives and which folder to run it from, based on
// this file's own location. server.mjs sits next to this file; the child must
// run with its cwd inside backend_api so it can find node_modules and .env.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "server.mjs");
const BACKEND_DIR = path.join(__dirname, "..");

// Load backend_api/.env so AI_KEY is available.
// We do this here (not relying on index.js) so the key is guaranteed no matter
// how this module is loaded. `quiet: true` suppresses dotenv's startup banner.
dotenv.config({ path: path.join(BACKEND_DIR, ".env"), quiet: true });

// Use a model available in the Salesforce gateway (from the docs)
const MODEL = "claude-sonnet-4-5-20250929";

// Salesforce LLM Gateway Express base URL
const BASE_URL = "https://eng-ai-model-gateway.sfproxy.devx-preprod.aws-esvc1-useast2.aws.sfdc.cl";

// Safety cap: how many times Claude may call tools before we stop. This makes
// it impossible for the tool loop to run forever if something goes wrong.
const MAX_TURNS = 5;

// Convert MCP tool schema to OpenAI function format
const convertMCPToolToOpenAI = (mcpTool) => {
  return {
    type: "function",
    function: {
      name: mcpTool.name,
      description: mcpTool.description,
      parameters: mcpTool.inputSchema,
    },
  };
};

// runAgent takes the user's chat message and their authenticated userId,
// then returns Claude's final text reply.
export const runAgent = async (userMessage, userId) => {
  // 1. Start the MCP server as a child process and connect to it over stdio,
  //    exactly like an MCP client (Claude Desktop / Claude Code) would.
  const transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_PATH],
    cwd: BACKEND_DIR,
  });
  const mcp = new Client({ name: "sidehustle-agent", version: "1.0.0" });
  await mcp.connect(transport);

  try {
    // 2. Ask the MCP server which tools it offers, then convert them to OpenAI format
    const { tools: mcpTools } = await mcp.listTools();
    const openaiTools = mcpTools.map(convertMCPToolToOpenAI);

    // 3. Create the OpenAI client configured for Salesforce gateway
    const client = new OpenAI({
      apiKey: process.env.AI_KEY,
      baseURL: BASE_URL,
    });

    // Build the system prompt that includes the authenticated user's ID.
    // This way Claude knows which userId to use when creating listings.
    const systemPrompt = `You are SideHustle AI, a helpful assistant for a freelance job marketplace.

The current authenticated user's ID is: ${userId}

When creating listings, ALWAYS use userId: ${userId}.

RESPONSE STYLE RULES:
- Be friendly and welcoming, but professional.
- Be concise - avoid unnecessary explanations.
- NO emojis ever.
- NO markdown formatting (no **, *, _, etc). Use plain text only.
- NO bullet points with "- " or "* ". Use numbered lists (1. 2. 3.) if needed.
- It's okay to offer help or ask clarifying questions when appropriate.
- Don't over-explain what you couldn't find - just state it simply and offer next steps.

GOOD EXAMPLES:
- "Unfortunately, there are no plumbers found in Manhattan. Would you like to post a job listing to request plumbing services? I can help you create one."
- "I found 3 plumbers in your area:"
- "I created your listing! It's now live and visible to providers."

BAD EXAMPLES:
- "Here are **3 great options** for you! 🎉" (has markdown and emoji)
- "I found one plumbing job listing, but that's someone looking for a plumber (not offering plumbing services). Unfortunately, there are no plumbers currently available in the system. Would you like to: - Post a job..." (too verbose, uses bullets)
- "No plumbers found. Create a listing." (too blunt, unfriendly)

Available tools:
- search_listings: Find job listings
- get_listing: Get details about a specific listing
- create_listing: Create new listing (uses userId ${userId})
- list_categories: List valid categories
- search_users: Find providers by skills/location
- get_user_profile: Get detailed user info
- match_providers_to_listing: Find best providers for a job
- match_listings_to_provider: Find best jobs for a provider
- save_conversation: Save conversation history (auto-save after major actions)
- get_conversation_history: Retrieve past conversations

IMPORTANT: After completing major actions (creating listing, matching, searching), consider saving the conversation with save_conversation tool. This helps users track their interaction history.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    // 4. The tool-use loop. Each turn: send the conversation to Claude; if it
    //    just wants to talk, return that text; if it wants a tool, run the tool
    //    through the MCP server, add the result, and loop again.
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: messages,
        tools: openaiTools,
        tool_choice: "auto", // Let Claude decide whether to use tools
      });

      const responseMessage = response.choices[0].message;

      // If there are no tool calls, Claude is done - return the text
      if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
        return responseMessage.content || "I couldn't generate a response.";
      }

      // Claude wants to use tools. Add its response to the conversation.
      messages.push(responseMessage);

      // Run every tool Claude asked for and collect the results.
      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`🔧 Claude calling tool: ${toolName}`, toolArgs);

        // Call the tool through the MCP server
        const result = await mcp.callTool({
          name: toolName,
          arguments: toolArgs,
        });

        // Extract the text content from MCP result
        const resultText = result.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("\n");

        // Add the tool result to the conversation in OpenAI format
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultText,
        });

        console.log(`✅ Tool result:`, resultText.substring(0, 100) + "...");
      }
    }

    // If we get here, Claude kept asking for tools past our safety cap.
    return "Sorry, I couldn't finish that request. Please try rephrasing it.";
  } finally {
    // Always shut the MCP server child process down, even if an error was
    // thrown above, so we don't leave stray processes running.
    await mcp.close();
  }
};
