// conversations.mjs
// Tool handlers for saving and retrieving agent conversation history.
//
// These tools allow the AI to save conversations to the database and
// retrieve past conversations for context or user reference.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to format results for MCP
const jsonResult = (data) => {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
};

// TOOL: save_conversation
// Save a conversation to the database with the actions taken.
// This creates a record of what the user asked and what the agent did.
export const saveConversation = async ({ userId, messages, actionTaken }) => {
  try {
    // Validate that actionTaken is one of the expected values
    const validActions = [
      "matched_providers",
      "matched_listings",
      "created_listing",
      "searched_listings",
      "searched_users",
      "viewed_profile",
      "general_conversation",
    ];

    const action = validActions.includes(actionTaken) ? actionTaken : "general_conversation";

    const conversation = await prisma.agentConversation.create({
      data: {
        userId: userId,
        messages: messages, // Store as JSON (array of message objects)
        actionTaken: action,
      },
    });

    return jsonResult({
      success: true,
      conversationId: conversation.id,
      message: "Conversation saved successfully",
    });
  } catch (error) {
    console.error("Error saving conversation:", error);
    return jsonResult({
      success: false,
      error: "Failed to save conversation",
    });
  }
};

// TOOL: get_conversation_history
// Retrieve past conversations for a user.
// Returns recent conversations with their messages and actions taken.
export const getConversationHistory = async ({ userId, limit = 10 }) => {
  try {
    const conversations = await prisma.agentConversation.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        messages: true,
        actionTaken: true,
        createdAt: true,
      },
    });

    // Format the conversations for easier reading
    const formattedConversations = conversations.map((conv) => {
      // Extract just the user messages for a summary
      const messages = Array.isArray(conv.messages) ? conv.messages : [];
      const userMessages = messages
        .filter((msg) => msg.role === "user")
        .map((msg) => msg.content);

      return {
        id: conv.id,
        date: conv.createdAt,
        actionTaken: conv.actionTaken,
        summary: userMessages[0] || "No user message",
        fullMessages: messages,
        messageCount: messages.length,
      };
    });

    return jsonResult({
      conversations: formattedConversations,
      total: formattedConversations.length,
    });
  } catch (error) {
    console.error("Error retrieving conversation history:", error);
    return jsonResult({
      error: "Failed to retrieve conversation history",
    });
  }
};
