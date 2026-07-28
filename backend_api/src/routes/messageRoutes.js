const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/security");
const {
  sendMessage,
  getConversationWithUser,
  getInbox,
  markConversationRead,
  getUnreadCount,
} = require("../controllers/messageController");

router.use(requireAuth);

router.post("/", sendMessage);
router.get("/conversations/:otherUserId", getConversationWithUser);
router.put("/conversations/:otherUserId/read", markConversationRead);
router.get("/inbox", getInbox);
router.get("/unread-count", getUnreadCount);

module.exports = router;
