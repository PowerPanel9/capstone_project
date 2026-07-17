const express = require("express");
const router = express.Router();

const { chatWithAgent } = require("../controllers/agentController");
const { requireAuth } = require("../middleware/security");

// POST /api/agent/chat
// The AIAgentModal sends the user's message here. Requires authentication so
// the agent knows which user it's talking to (needed for creating listings).
router.post("/chat", requireAuth, chatWithAgent);

module.exports = router;
