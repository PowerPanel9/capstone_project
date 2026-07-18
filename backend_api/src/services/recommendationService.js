// recommendationService.js
// This service builds a PERSONALIZED home feed for a provider.
//
// Normally the home feed shows every open listing, newest first. Here we ask
// the AI to re-order the open listings so the ones that best fit THIS provider
// (based on their skills and their history) float to the top, each with a short
// reason we can show on the card.
//
// This is a DIRECT AI call (like priceIntelligenceService and
// applicantRankingService), not the chatbot. It does NOT use the MCP server or
// the agent tool-loop.
//
// The AI only ever RE-ORDERS real listings and returns their ids. We look each
// id up against the listings we actually loaded, so the AI cannot invent a
// listing (same anti-hallucination guard used in applicantRankingService).

const { PrismaClient } = require("@prisma/client");
const OpenAI = require("openai");

const prisma = new PrismaClient();

// Same Salesforce LLM gateway settings the rest of the app uses.
// AI_KEY comes from backend_api/.env, which index.js already loads.
const MODEL = "claude-sonnet-4-5-20250929";
const BASE_URL =
  "https://eng-ai-model-gateway.sfproxy.devx-preprod.aws-esvc1-useast2.aws.sfdc.cl";

// How many open listings we consider / return. Keeping this small keeps the AI
// prompt cheap and fast.
const MAX_LISTINGS = 30;

/**
 * Build a personalized, AI-ranked feed of open listings for a provider.
 * @param {number} userId - The logged-in provider's id
 * @returns {Object} - { listings, personalized, message? }
 *   listings: the listing objects in recommended order (each may have a `reason`)
 *   personalized: true if the AI ranked them, false if we fell back
 */
async function getRecommendedListings(userId) {
  // Step 1: Load the provider so the AI knows their skills and location.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      skills: true,
      location: true,
    },
  });

  if (!user) {
    return { listings: [], personalized: false, message: "User not found." };
  }

  // Step 2: Load the provider's history — the listings they applied to and the
  // ones they bookmarked. This tells the AI what kind of work they go for.
  const [applications, bookmarks] = await Promise.all([
    prisma.application.findMany({
      where: { providerId: userId },
      select: {
        listing: {
          select: { title: true, category: true, skillsRequired: true },
        },
      },
      take: 20,
    }),
    prisma.bookmark.findMany({
      where: { userId: userId },
      select: {
        listing: {
          select: { title: true, category: true, skillsRequired: true },
        },
      },
      take: 20,
    }),
  ]);

  // Step 3: Load the open listings that are candidates for the feed. We exclude
  // the provider's own listings (they wouldn't apply to their own job).
  const openListings = await prisma.listing.findMany({
    where: {
      status: "OPEN",
      userId: { not: userId },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_LISTINGS,
    // Same fields the normal feed already uses, so the frontend renders them
    // the same way. We add `reason` ourselves after the AI responds.
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
    },
  });

  // Step 4: If there is nothing to rank, just hand back what we have.
  if (openListings.length === 0) {
    return { listings: [], personalized: false, message: "No open listings yet." };
  }

  // Build a small history summary for the prompt (titles + categories only).
  const history = {
    skills: user.skills,
    location: user.location,
    appliedTo: applications.map((a) => a.listing).filter(Boolean),
    bookmarked: bookmarks.map((b) => b.listing).filter(Boolean),
  };

  // Step 5: Ask the AI to rank the listing ids. On any failure we fall back to
  // the plain (newest-first) feed so the home page always works.
  let ranking;
  try {
    ranking = await getAiRanking(history, openListings);
  } catch (error) {
    console.error("Recommendation ranking failed:", error.message);
    return {
      listings: openListings, // newest-first, no AI reasons
      personalized: false,
      message: "Personalized feed is unavailable right now. Showing latest listings.",
    };
  }

  // Step 6: Rebuild the feed in the AI's chosen order. We only keep ids that
  // belong to a real candidate listing, so the AI cannot invent listings.
  const listingsById = {};
  openListings.forEach((listing) => {
    listingsById[listing.id] = listing;
  });

  const ranked = ranking
    .filter((item) => listingsById[item.listingId]) // drop any invented ids
    .map((item) => ({
      ...listingsById[item.listingId],
      reason: item.reason,
    }));

  // Step 7: If the AI skipped any listing, add it to the end so nothing is lost.
  const rankedIds = ranked.map((listing) => listing.id);
  const leftovers = openListings.filter(
    (listing) => !rankedIds.includes(listing.id)
  );

  return {
    listings: [...ranked, ...leftovers],
    personalized: true,
  };
}

/**
 * Ask Claude to rank the open listings for this provider.
 * Returns an array like [{ listingId, reason }] sorted best-fit first.
 * @param {Object} history - The provider's skills, location, and past activity
 * @param {Array} listings - The open listings to rank
 * @returns {Array} - The AI's ranking
 */
async function getAiRanking(history, listings) {
  const client = new OpenAI({
    apiKey: process.env.AI_KEY,
    baseURL: BASE_URL,
  });

  // We only send the AI the fields it needs to judge fit. Smaller = faster.
  const listingsForAi = listings.map((listing) => ({
    listingId: listing.id,
    title: listing.title,
    category: listing.category,
    description: listing.description,
    skillsRequired: listing.skillsRequired,
    location: listing.location,
    price: listing.price,
  }));

  const systemPrompt = `You are a recommendation assistant for a job marketplace called SideHustle.
You are given a PROVIDER (someone looking for work) and a list of OPEN job listings.
Rank the listings from best fit to worst fit for THIS provider.

Base your ranking on how well each listing matches the provider's skills,
location, and the kinds of jobs they have applied to or bookmarked before.

Respond with ONLY a JSON array, no extra text, in this exact shape:
[{ "listingId": number, "reason": "one short sentence" }]

Rules:
- The first item is the best fit.
- Include every listing exactly once.
- Only use listingId values from the listings given to you.
- Keep each reason to one short, plain sentence the provider can read quickly.`;

  const userPrompt = `PROVIDER:
${JSON.stringify(history, null, 2)}

OPEN LISTINGS:
${JSON.stringify(listingsForAi, null, 2)}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const text = response.choices[0].message.content;

  // Pull out the JSON array in case the AI wrapped it in extra characters.
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new Error("AI did not return a JSON array");
  }

  return JSON.parse(text.substring(start, end + 1));
}

module.exports = {
  getRecommendedListings,
};
