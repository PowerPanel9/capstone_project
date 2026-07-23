// applicantRankingService.js
// This service uses AI to rank the providers who applied to a job listing.
//
// Unlike the matching tools (which score with an algorithm), here Claude itself
// decides the order: we send it the listing plus every applicant's profile, and
// it returns the applicants sorted best-fit first, each with a short reason.
//
// This is a DIRECT AI call (like priceIntelligenceService), not the chatbot.
// It does NOT use the MCP server or the agent tool-loop.

const { PrismaClient } = require("@prisma/client");
const OpenAI = require("openai");

const prisma = new PrismaClient();

// AI settings all come from backend_api/.env, which index.js loads.
// Switching AI providers only means editing .env, not this file.
const MODEL = process.env.AI_MODEL;
const BASE_URL = process.env.AI_BASE_URL;

/**
 * Rank the applicants for a listing using AI.
 * @param {number} listingId - The id of the listing to rank applicants for
 * @returns {Object} - { listingId, listingTitle, applicants, aiRanked }
 */
async function rankApplicants(listingId) {
  // Step 1: Get the listing so the AI knows what the job needs.
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      description: true,
      skillsRequired: true,
      location: true,
      category: true,
    },
  });

  if (!listing) {
    return { error: "Listing not found" };
  }

  // Step 2: Get every application for this listing, including each applicant's
  // profile and the star ratings from reviews they've received.
  const applications = await prisma.application.findMany({
    where: { listingId: listingId },
    select: {
      id: true,
      status: true,
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          bio: true,
          skills: true,
          location: true,
          reviewsReceived: {
            select: { stars: true },
          },
        },
      },
    },
  });

  // Step 3: If nobody has applied, there is nothing to rank.
  if (applications.length === 0) {
    return {
      listingId: listing.id,
      listingTitle: listing.title,
      applicants: [],
      aiRanked: false,
      message: "No one has applied to this listing yet.",
    };
  }

  // Step 4: Flatten each application into a simple object we can send to the AI.
  // We compute the average rating here (plain math) just to give the AI a hint;
  // the AI still decides the final order.
  const applicants = applications.map((application) => {
    const reviews = application.provider.reviewsReceived;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length
        : null;

    return {
      applicationId: application.id,
      providerId: application.provider.id,
      name: `${application.provider.firstName} ${application.provider.lastName}`,
      bio: application.provider.bio,
      skills: application.provider.skills,
      location: application.provider.location,
      avgRating: avgRating ? Number(avgRating.toFixed(1)) : null,
      reviewCount: reviews.length,
      status: application.status,
    };
  });

  // Step 5: Ask the AI to rank the applicants. If anything goes wrong, we fall
  // back to the plain (unranked) list so the feature still works.
  let ranking;
  try {
    ranking = await getAiRanking(listing, applicants);
  } catch (error) {
    console.error("AI ranking failed:", error.message);
    return {
      listingId: listing.id,
      listingTitle: listing.title,
      applicants: applicants, // original order, no AI reasons
      aiRanked: false,
      message: "AI ranking is unavailable right now. Showing applicants in order.",
    };
  }

  // Step 6: Rebuild the applicant list in the AI's chosen order.
  // We look up each applicant by providerId and attach the AI's rank + reason.
  // We only trust providerIds that actually belong to a real applicant, so the
  // AI cannot invent people (this guards against hallucination).
  const applicantsById = {};
  applicants.forEach((applicant) => {
    applicantsById[applicant.providerId] = applicant;
  });

  const rankedApplicants = ranking
    .filter((item) => applicantsById[item.providerId]) // drop any invented ids
    .map((item) => ({
      ...applicantsById[item.providerId],
      rank: item.rank,
      reason: item.reason,
    }));

  // Step 7: If the AI skipped anyone, add them to the end so no applicant is lost.
  const rankedIds = rankedApplicants.map((applicant) => applicant.providerId);
  const leftovers = applicants
    .filter((applicant) => !rankedIds.includes(applicant.providerId))
    .map((applicant) => ({
      ...applicant,
      rank: null,
      reason: "Not ranked by AI.",
    }));

  return {
    listingId: listing.id,
    listingTitle: listing.title,
    applicants: [...rankedApplicants, ...leftovers],
    aiRanked: true,
  };
}

/**
 * Ask Claude to rank the applicants and explain each choice.
 * Returns an array like [{ providerId, rank, reason }] sorted best-fit first.
 * @param {Object} listing - The listing the applicants applied to
 * @param {Array} applicants - The applicants to rank
 * @returns {Array} - The AI's ranking
 */
async function getAiRanking(listing, applicants) {
  // Create the AI client (same gateway as the chatbot).
  const client = new OpenAI({
    apiKey: process.env.AI_KEY,
    baseURL: BASE_URL,
  });

  // Tell the AI its job and, importantly, the exact JSON shape we expect back.
  const systemPrompt = `You are a hiring assistant for a job marketplace called SideHustle.
You are given a job listing and the list of people who applied to it.
Rank the applicants from best fit to worst fit for THIS specific job.

Base your ranking on how well each applicant's skills, location, bio, and
ratings match what the job needs.

Respond with ONLY a JSON array, no extra text, in this exact shape:
[{ "providerId": number, "rank": number, "reason": "one short sentence" }]

Rules:
- rank 1 is the best fit.
- Include every applicant exactly once.
- Only use providerId values from the applicants given to you.
- Keep each reason to one plain sentence a client can quickly read.`;

  // Give the AI the job details and the applicants as readable JSON.
  const userPrompt = `JOB LISTING:
${JSON.stringify(listing, null, 2)}

APPLICANTS:
${JSON.stringify(applicants, null, 2)}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const text = response.choices[0].message.content;

  // The AI returns text, so we parse it into a real array. We pull out the
  // JSON array in case the AI wrapped it in any extra characters.
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new Error("AI did not return a JSON array");
  }

  return JSON.parse(text.substring(start, end + 1));
}

module.exports = {
  rankApplicants,
};
