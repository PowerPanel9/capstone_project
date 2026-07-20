// agentController.js
// Controller for the AI agent feature.
//
// This is the thin HTTP layer: it reads the request, calls the agent "brain"
// (mcp/agentClient.mjs), and sends the reply back as JSON. All the heavy
// lifting — talking to Claude and running MCP tools — lives in the helper.

const path = require("path");
const { pathToFileURL } = require("url");

// POST /api/agent/chat
// Body: { "message": "find plumbing listings" }
// Response: { "reply": "..." }
const chatWithAgent = async (req, res) => {
  try {
    // requireAuth middleware ensures req.user is set
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Pull the user's message out of the request body and validate it.
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "A 'message' string is required" });
    }

    console.log("📩 Received message from user", req.user.userId, ":", message);

    // Our backend is CommonJS (`require`), but agentClient.mjs is an ES module.
    // A dynamic import() lets CommonJS load an ESM file. We build an absolute
    // file URL so the path resolves the same way no matter where the server
    // was started from.
    const helperPath = path.join(__dirname, "..", "..", "mcp", "agentClient.mjs");
    console.log("📂 Loading agent from:", helperPath);

    const { runAgent } = await import(pathToFileURL(helperPath).href);
    console.log("✅ Agent loaded, calling runAgent...");

    // Pass both the message and the authenticated user's ID to the agent
    const reply = await runAgent(message, req.user.userId);
    console.log("✅ Agent replied:", reply);

    return res.status(200).json({ reply });
  } catch (error) {
    // Log the real error for us, but don't leak internal details to the client.
    console.error("❌ chatWithAgent error:", error);
    console.error("Full error stack:", error.stack);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = { chatWithAgent };
