// server.mjs
// This is the entry point for the SideHustle MCP server.
//
// It is the MCP equivalent of your Express index.js:
//   - index.js  creates `app`, registers routes, and listens on a PORT.
//   - server.mjs creates `server`, registers TOOLS, and listens on stdio.
//
// A "tool" is like a route + controller pair. We register each tool with:
//   1. a name        (what the AI calls it)
//   2. a description  (so the AI knows when to use it)
//   3. an inputSchema (Zod fields describing the arguments, like req.body)
//   4. a handler      (the function that runs, from tools/listings.mjs)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  VALID_CATEGORIES,
  searchListings,
  getListing,
  listCategories,
  createListing,
} from "./tools/listings.mjs";

import {
  searchUsers,
  getUserProfile,
} from "./tools/users.mjs";

import {
  matchProvidersToListing,
  matchListingsToProvider,
} from "./tools/matching.mjs";

import {
  saveConversation,
  getConversationHistory,
} from "./tools/conversations.mjs";

// Load environment variables (DATABASE_URL) from backend_api/.env so Prisma
// can connect. The path is resolved relative to this file.
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// `quiet: true` stops dotenv from printing a banner. That matters here because
// stdout is reserved for MCP protocol messages — any stray text corrupts it.
dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

// A Zod version of the category list, so the AI can only pass a valid value.
const categoryEnum = z.enum(VALID_CATEGORIES);

// Create the server instance (name + version, like your app's identity).
const server = new McpServer({
  name: "sidehustle",
  version: "1.0.0",
});

// TOOL 1: search_listings — read/filter listings (matched_listings action).
server.registerTool(
  "search_listings",
  {
    description:
      "Search SideHustle job listings. All filters are optional; with no filters it returns every listing, newest first.",
    inputSchema: {
      search: z
        .string()
        .optional()
        .describe("Keyword to match in the title, description, or custom category"),
      category: categoryEnum.optional().describe("Exact category to filter by"),
      custom_category: z
        .string()
        .optional()
        .describe("Free-text category, only used when category is OTHER"),
      location: z.string().optional().describe("Partial location to match, e.g. 'Lincoln'"),
    },
  },
  searchListings,
);

// TOOL 2: get_listing — read one listing by id.
server.registerTool(
  "get_listing",
  {
    description: "Get one SideHustle listing by its numeric id.",
    inputSchema: {
      id: z.number().int().describe("The listing's id"),
    },
  },
  getListing,
);

// TOOL 3: list_categories — tell the AI which categories exist.
server.registerTool(
  "list_categories",
  {
    description:
      "List the valid listing categories. Call this before searching or creating if unsure which categories are allowed.",
    inputSchema: {},
  },
  listCategories,
);

// TOOL 4: create_listing — create a listing (created_listing action).
// userId identifies the owner because there is no login/token here.
server.registerTool(
  "create_listing",
  {
    description:
      "Create a new SideHustle listing on behalf of a user. The userId must belong to an existing user.",
    inputSchema: {
      title: z.string().describe("Short title of the job"),
      category: categoryEnum.describe("One of the valid categories"),
      custom_category: z
        .string()
        .optional()
        .describe("Required only when category is OTHER"),
      description: z.string().describe("Details about the job"),
      price: z.number().describe("How much the listing pays"),
      location: z.string().describe("Where the job is needed"),
      skills_required: z
        .array(z.string())
        .optional()
        .describe("List of skills needed (optional)"),
      image_url: z.string().optional().describe("Optional image URL"),
      userId: z.number().int().describe("The id of the user who owns this listing"),
    },
  },
  createListing,
);

// TOOL 5: search_users — find providers by skills and location.
server.registerTool(
  "search_users",
  {
    description:
      "Search for users/providers by skills, location, or keywords. Use this to find people who can do specific jobs.",
    inputSchema: {
      skills: z
        .array(z.string())
        .optional()
        .describe("List of skills to search for (e.g., ['plumbing', 'handyman'])"),
      location: z.string().optional().describe("Location to search in (e.g., 'Manhattan')"),
      search: z
        .string()
        .optional()
        .describe("Keyword to search in name or bio"),
    },
  },
  searchUsers,
);

// TOOL 6: get_user_profile — get detailed info about a specific user/provider.
server.registerTool(
  "get_user_profile",
  {
    description:
      "Get detailed profile information about a specific user, including their bio, skills, reviews, and work history.",
    inputSchema: {
      userId: z.number().int().describe("The user's id"),
    },
  },
  getUserProfile,
);

// TOOL 7: match_providers_to_listing — find best providers for a listing.
server.registerTool(
  "match_providers_to_listing",
  {
    description:
      "Find the best matching providers for a specific job listing. Uses an algorithm that considers skills, location, and reviews to rank candidates.",
    inputSchema: {
      listingId: z.number().int().describe("The listing's id to find providers for"),
    },
  },
  matchProvidersToListing,
);

// TOOL 8: match_listings_to_provider — find best listings for a provider.
server.registerTool(
  "match_listings_to_provider",
  {
    description:
      "Find the best matching job listings for a specific provider. Shows jobs that match their skills and location.",
    inputSchema: {
      userId: z.number().int().describe("The provider's user id"),
    },
  },
  matchListingsToProvider,
);

// TOOL 9: save_conversation — save conversation history to database.
server.registerTool(
  "save_conversation",
  {
    description:
      "Save the current conversation to the database. Use this at the end of a conversation or after completing a major action.",
    inputSchema: {
      userId: z.number().int().describe("The user's id"),
      messages: z
        .array(z.any())
        .describe("Array of message objects from the conversation"),
      actionTaken: z
        .string()
        .describe(
          "What action was taken: matched_providers, matched_listings, created_listing, searched_listings, searched_users, viewed_profile, or general_conversation"
        ),
    },
  },
  saveConversation,
);

// TOOL 10: get_conversation_history — retrieve past conversations.
server.registerTool(
  "get_conversation_history",
  {
    description:
      "Retrieve past conversation history for a user. Use this when the user asks about previous conversations or wants to continue from before.",
    inputSchema: {
      userId: z.number().int().describe("The user's id"),
      limit: z
        .number()
        .int()
        .optional()
        .describe("Maximum number of conversations to return (default: 10)"),
    },
  },
  getConversationHistory,
);

// Start listening on stdio. This is the MCP version of app.listen():
// instead of a network port, the server talks to its client over
// standard input/output. We log to stderr (console.error) because stdout
// is reserved for the protocol messages themselves.
const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SideHustle MCP server running on stdio");
};

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
