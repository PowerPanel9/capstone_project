const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/security");
const {
  sendMessage,
  getConversationWithUser,
  getInbox,
} = require("../controllers/messageController");

router.use(requireAuth);

router.post("/", sendMessage);
router.get("/conversations/:otherUserId", getConversationWithUser);
router.get("/inbox", getInbox);

module.exports = router;
