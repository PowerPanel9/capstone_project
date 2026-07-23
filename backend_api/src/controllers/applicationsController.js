// applicationsController.js
// Controller functions for the Applications feature.
// A provider applies to a listing. The application links the provider (the
// logged-in user) to the listing, with an optional phone + message and a
// status (PENDING / ACCEPTED / REJECTED).

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// The AI ranking logic lives in its own service file. We just call it here.
const { rankApplicants } = require("../services/applicantRankingService");

const VALID_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"];

// POST /api/applications
// Apply to a listing. The applicant (provider) is the logged-in user.
async function createApplication(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const providerId = req.user.userId;
    const { listing_id, phone, message } = req.body;

    if (listing_id === undefined) {
      return res.status(400).json({ error: "listing_id is required" });
    }

    // The listing must exist (404 if not).
    const listing = await prisma.listing.findUnique({ where: { id: listing_id } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Can't apply to your own listing.
    if (listing.userId === providerId) {
      return res.status(400).json({ error: "You cannot apply to your own listing" });
    }

    // Already applied? (schema has @@unique([providerId, listingId]))
    const existing = await prisma.application.findUnique({
      where: { providerId_listingId: { providerId, listingId: listing_id } },
    });
    if (existing) {
      return res.status(400).json({ error: "You have already applied to this listing" });
    }

    const application = await prisma.application.create({
      data: {
        providerId,
        listingId: listing_id,
        phone: phone || null,
        message: message || null,
      },
    });

    return res.status(201).json(application);
  } catch (error) {
    console.error("createApplication error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// GET /api/applications/user
// Applications the current user SENT (provider view). Includes each listing
// (and its owner) so the profile can show what they applied to.
async function getMyApplications(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const applications = await prisma.application.findMany({
      where: { providerId: req.user.userId },
      include: { listing: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(applications);
  } catch (error) {
    console.error("getMyApplications error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// GET /api/applications/received
// Applications RECEIVED on the current user's listings (client view).
// Includes the provider so the profile can show who applied.
async function getReceivedApplications(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const applications = await prisma.application.findMany({
      where: { listing: { userId: req.user.userId } },
      include: { provider: true, listing: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(applications);
  } catch (error) {
    console.error("getReceivedApplications error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// GET /api/applications/listing/:listing_id
// All applications for one listing (client view). Only the listing owner may see them.
async function getApplicationsForListing(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const listingId = Number(req.params.listing_id);

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Only the listing owner can see who applied.
    if (listing.userId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const applications = await prisma.application.findMany({
      where: { listingId },
      include: { provider: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(applications);
  } catch (error) {
    console.error("getApplicationsForListing error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// GET /api/applications/listing/:listing_id/ranked
// Same as above, but the applicants come back AI-ranked (best fit first),
// each with a rank number and a short reason. Only the listing owner may see them.
async function getRankedApplicationsForListing(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const listingId = Number(req.params.listing_id);

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Only the listing owner can rank who applied to their listing.
    if (listing.userId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    // The service does the AI work and already handles its own fallback
    // (aiRanked: false) if the AI is unavailable, so we just pass its result on.
    const result = await rankApplicants(listingId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("getRankedApplicationsForListing error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// PUT /api/applications/:id
// Accept or reject an application. Only the listing owner may do this.
async function updateApplicationStatus(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = Number(req.params.id);
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    // Load the application and its listing to check ownership.
    const application = await prisma.application.findUnique({
      where: { id },
      include: { listing: true },
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Only the owner of the listing can accept/reject.
    if (application.listing.userId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
    });

    // When an application is ACCEPTED, the listing no longer needs applicants ->
    // move it to IN_PROGRESS so it drops off the home feed.
    if (status === "ACCEPTED") {
      await prisma.listing.update({
        where: { id: application.listingId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("updateApplicationStatus error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// DELETE /api/applications/:id
// Withdraw an application. Only the applicant may withdraw their own.
async function withdrawApplication(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = Number(req.params.id);

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Only the applicant can withdraw.
    if (application.providerId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    await prisma.application.delete({ where: { id } });

    return res.status(200).json({ message: "Application withdrawn successfully" });
  } catch (error) {
    console.error("withdrawApplication error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = {
  createApplication,
  getMyApplications,
  getReceivedApplications,
  getApplicationsForListing,
  getRankedApplicationsForListing,
  updateApplicationStatus,
  withdrawApplication,
};
