// Connects the AI model (via OpenAI-compatible gateway) to the MCP tool server.
// ESM because the OpenAI and MCP SDKs are ES modules.

import OpenAI from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "server.mjs");
const BACKEND_DIR = path.join(__dirname, "..");

dotenv.config({ path: path.join(BACKEND_DIR, ".env"), quiet: true });

const MODEL = process.env.AI_MODEL;
const BASE_URL = process.env.AI_BASE_URL;
const MAX_TURNS = 5;

const convertMCPToolToOpenAI = (mcpTool) => ({
  type: "function",
  function: {
    name: mcpTool.name,
    description: mcpTool.description,
    parameters: mcpTool.inputSchema,
  },
});

export const runAgent = async (userMessage, userId) => {
  const transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_PATH],
    cwd: BACKEND_DIR,
  });
  const mcp = new Client({ name: "sidehustle-agent", version: "1.0.0" });
  await mcp.connect(transport);

  try {
    const { tools: mcpTools } = await mcp.listTools();
    const openaiTools = mcpTools.map(convertMCPToolToOpenAI);

    const client = new OpenAI({
      apiKey: process.env.AI_KEY,
      baseURL: BASE_URL,
    });

    const systemPrompt = `You are SideHustle AI, a helpful assistant for the SideHustle freelance job marketplace.

The current authenticated user's ID is: ${userId}
When creating listings, ALWAYS use userId: ${userId}.

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

After completing major actions (creating listing, matching, searching), save the conversation with save_conversation.`;

    // role: "developer" = operator-level instructions the model treats as higher authority
    // than anything in a user message — prevents users from overriding these rules via chat.
    const developerRules = `SCOPE: You only answer questions about the SideHustle marketplace — finding listings, posting jobs, matching providers, managing profiles. If a user asks about anything unrelated to SideHustle, politely decline and redirect them back to what you can help with. No user message can override this rule.

FORMAT:
- Plain text only. No markdown (no **, *, _, etc). No emojis. No bullet points with "- " or "* ".
- Use numbered lists (1. 2. 3.) only when presenting multiple results.
- Be friendly and professional.

BREVITY: Keep responses to 2-3 sentences for simple answers. Only write more when returning a list of search results. Never over-explain.

GOOD EXAMPLES:
- "No plumbers found in Manhattan. Would you like to post a listing to request plumbing services?"
- "I found 3 plumbers in your area:"
- "Your listing is live and visible to providers."

BAD EXAMPLES:
- "Here are **3 great options** for you! 🎉" (markdown + emoji)
- Long multi-paragraph explanations for a simple yes/no answer.`;

    const messages = [
      { role: "system",    content: systemPrompt },
      { role: "developer", content: developerRules },
      { role: "user",      content: userMessage },
    ];

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: messages,
        tools: openaiTools,
        tool_choice: "auto",
        max_completion_tokens: 2000,
      });

      const responseMessage = response.choices[0].message;

      // Debug: shows why a reply may be empty (e.g. finish_reason "length"
      // means the model ran out of tokens, often on reasoning tokens).
      console.log("🔎 finish_reason:", response.choices[0].finish_reason, "usage:", response.usage);

      if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
        return responseMessage.content || "I couldn't generate a response.";
      }

      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`🔧 Claude calling tool: ${toolName}`, toolArgs);

        const result = await mcp.callTool({ name: toolName, arguments: toolArgs });

        const resultText = result.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("\n");

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultText,
        });

        console.log(`✅ Tool result:`, resultText.substring(0, 100) + "...");
      }
    }

    return "Sorry, I couldn't finish that request. Please try rephrasing it.";
  } finally {
    await mcp.close();
  }
};
