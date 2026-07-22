const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MAX_CONTENT_LENGTH = 2000;

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.userId;
    const recipientId = toPositiveInt(req.body?.recipientId);
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : null;
    // Optional: the listing this message is about. Only some messages have one.
    const listingId = req.body?.listingId != null ? toPositiveInt(req.body.listingId) : null;

    if (!Number.isInteger(senderId) || senderId <= 0) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    if (!recipientId) {
      return res.status(400).json({ error: "recipientId must be a positive integer" });
    }

    if (senderId === recipientId) {
      return res.status(400).json({ error: "You cannot send a message to yourself" });
    }

    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ error: `Message content must be ${MAX_CONTENT_LENGTH} characters or less` });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });

    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    // If a listingId was sent, make sure it points to a real listing before we
    // attach it. If it doesn't exist, reject with a clear 404.
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { id: true },
      });
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
    }

    const message = await prisma.message.create({
      data: {
        userIdFrom: senderId,
        userIdTo: recipientId,
        content,
        imageUrl: imageUrl || null,
        listingId: listingId || null,
      },
      select: {
        id: true,
        userIdFrom: true,
        userIdTo: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ error: "Error sending message" });
  }
};

const getConversationWithUser = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const otherUserId = toPositiveInt(req.params?.otherUserId);

    if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    if (!otherUserId) {
      return res.status(400).json({ error: "otherUserId must be a positive integer" });
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, firstName: true, lastName: true, imageUrl: true },
    });

    if (!otherUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { userIdFrom: currentUserId, userIdTo: otherUserId },
          { userIdFrom: otherUserId, userIdTo: currentUserId },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userIdFrom: true,
        userIdTo: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    return res.status(200).json({
      otherUser,
      messages,
    });
  } catch (error) {
    console.error("getConversationWithUser error:", error);
    return res.status(500).json({ error: "Error fetching conversation" });
  }
};

const getInbox = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const allMessages = await prisma.message.findMany({
      where: {
        OR: [{ userIdFrom: currentUserId }, { userIdTo: currentUserId }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userIdFrom: true,
        userIdTo: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        sender: {
          select: { id: true, firstName: true, lastName: true, imageUrl: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, imageUrl: true },
        },
      },
    });

    const latestByPartner = new Map();

    for (const message of allMessages) {
      const partnerId = message.userIdFrom === currentUserId ? message.userIdTo : message.userIdFrom;
      if (!latestByPartner.has(partnerId)) {
        const partner = message.userIdFrom === currentUserId ? message.recipient : message.sender;
        latestByPartner.set(partnerId, {
          partner,
          lastMessage: {
            id: message.id,
            userIdFrom: message.userIdFrom,
            userIdTo: message.userIdTo,
            content: message.content,
            imageUrl: message.imageUrl,
            createdAt: message.createdAt,
          },
        });
      }
    }

    return res.status(200).json(Array.from(latestByPartner.values()));
  } catch (error) {
    console.error("getInbox error:", error);
    return res.status(500).json({ error: "Error fetching inbox" });
  }
};

module.exports = {
  sendMessage,
  getConversationWithUser,
  getInbox,
};
