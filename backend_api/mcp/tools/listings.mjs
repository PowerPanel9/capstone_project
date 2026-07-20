// listings.mjs
// These are the "tool handlers" for the SideHustle MCP server.
//
// Think of each function below like a controller in your Express app:
// it receives some input, talks to the database through Prisma, and
// returns a result. The difference is the CALLER is an AI model (through
// an MCP client) instead of a browser sending an HTTP request.
//
// NOTE: this file uses ES module `import` (not `require`) because the MCP
// SDK is ESM-only. That is also why the filename ends in `.mjs`.

import { PrismaClient, ListingCategory } from "@prisma/client";

// One shared Prisma client for every tool, just like your controllers do.
const prisma = new PrismaClient();

// The list of valid category values, taken straight from the Prisma enum so
// this never drifts out of sync with the schema. Example: ["CLEANING", ...].
export const VALID_CATEGORIES = Object.values(ListingCategory);

// Small helper: is this value one of the allowed categories?
const isValidCategory = (value) => {
  return VALID_CATEGORIES.includes(value);
};

// Every MCP tool must return an object shaped like { content: [...] }.
// This little helper turns any JavaScript value into that shape by sending
// it back as formatted JSON text, so the AI can read the data.
const jsonResult = (data) => {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
};

// TOOL: search_listings
// Mirrors GET /api/listings (getAllListings). Builds a Prisma "where" object
// from the optional filters the AI passes in. No filters = return everything.
export const searchListings = async ({ search, category, custom_category, location }) => {
  const where = {};

  // Keyword search across title, description, and the free-text custom category.
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { customCategory: { contains: search, mode: "insensitive" } },
    ];
  }

  // Exact category match. We validate here so the AI gets a clear message
  // instead of a confusing database error.
  if (category) {
    if (!isValidCategory(category)) {
      return jsonResult({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }
    where.category = category;

    // Special case: OTHER + custom_category narrows the free-text bucket.
    if (category === "OTHER" && custom_category) {
      where.customCategory = { contains: custom_category, mode: "insensitive" };
    }
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  const listings = await prisma.listing.findMany({
    where,
    include: { user: true }, // attach the creator so the AI can mention who posted it
    orderBy: { createdAt: "desc" }, // newest first
  });

  return jsonResult(listings);
};

// TOOL: get_listing
// Mirrors GET /api/listings/:id (getListingById). Fetch one listing by id.
export const getListing = async ({ id }) => {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!listing) {
    return jsonResult({ error: "Listing not found" });
  }

  return jsonResult(listing);
};

// TOOL: list_categories
// Returns the allowed category values so the AI knows what it can search by
// or create with. There is no matching Express route; this exists purely to
// help the AI use the other tools correctly.
export const listCategories = async () => {
  return jsonResult({ categories: VALID_CATEGORIES });
};

// TOOL: create_listing
// Mirrors POST /api/listings (createListing). In the Express app the owner
// came from the JWT (req.user.userId). An MCP server has no request or token,
// so the owner's `userId` is passed in as a tool argument instead.
//
// NOTE FOR PRODUCTION: passing userId directly means the caller is trusted.
// A real app would authenticate the user first. This is fine for learning.
export const createListing = async ({
  title,
  category,
  custom_category,
  description,
  price,
  location,
  skills_required,
  image_url,
  userId,
}) => {
  // Same required-field check as the controller.
  if (!title || !category || !description || price === undefined || !location) {
    return jsonResult({ error: "Missing required fields" });
  }

  if (!isValidCategory(category)) {
    return jsonResult({
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
    });
  }

  // OTHER requires the free-text category; fixed categories store null.
  if (category === "OTHER" && !custom_category) {
    return jsonResult({
      error: "custom_category is required when category is OTHER",
    });
  }
  const customCategory = category === "OTHER" ? custom_category : null;

  // Confirm the owner actually exists before creating the listing, the same
  // way getListingsByUser checks the user first.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return jsonResult({ error: "User not found" });
  }

  const newListing = await prisma.listing.create({
    data: {
      title,
      category,
      customCategory,
      imageUrl: image_url, // optional; ok if undefined
      description,
      price,
      skillsRequired: skills_required || [],
      location,
      userId,
      createdByAgent: true, // this listing was made through the AI agent
    },
  });

  return jsonResult(newListing);
};
