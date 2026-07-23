const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The valid category values, matching the ListingCategory enum in schema.prisma.
// Experiences reuse the same categories as listings.
const VALID_CATEGORIES = [
    "CLEANING", "TUTORING", "PLUMBING", "GARDENING", "BEAUTY",
    "BABYSITTING", "MOVING", "HANDYMAN", "DELIVERY", "OTHER",
];

function isValidCategory(value) {
    return VALID_CATEGORIES.includes(value);
}

// When we send experiences to the frontend we also include a little bit of the
// poster's public info (id + name + picture) so the home grid can show who
// posted it and link to their profile. We never include private fields.
const experienceWithPoster = {
    id: true,
    userId: true,
    jobTitle: true,
    category: true,
    customCategory: true,
    description: true,
    images: true,
    createdAt: true,
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
        },
    },
};

// GET /api/experiences
// Returns every experience, in a random order, so the client home feed shows a
// different mix each time it loads. Same shuffle approach as getProviders.
// Optionally filtered by ?category=VALUE (and ?custom_category=text for OTHER),
// just like the listings feed.
const getExperiences = async (req, res) => {
    try {
        const { category, custom_category } = req.query;

        // Build a "where" filter only if a valid category was passed.
        const where = {};
        if (category) {
            if (!isValidCategory(category)) {
                return res.status(400).json({
                    message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
                });
            }
            where.category = category;

            // OTHER + custom text: narrow to experiences whose free-text
            // category partially matches (e.g. "dog" -> "dog walking").
            if (category === "OTHER" && custom_category) {
                where.customCategory = { contains: custom_category, mode: "insensitive" };
            }
        }

        const experiences = await prisma.experience.findMany({
            where,
            select: experienceWithPoster,
        });

        // Shuffle so the feed shows a fresh order each load (Fisher–Yates).
        for (let i = experiences.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [experiences[i], experiences[j]] = [experiences[j], experiences[i]];
        }

        res.status(200).json(experiences);
    } catch (error) {
        console.error("getExperiences error:", error);
        res.status(500).json({ message: "Error fetching experiences" });
    }
};

// GET /api/experiences/:id
// Returns a single experience (used by the detail page). Includes the poster's
// public info so the page can show and link to who posted it.
const getExperienceById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid experience id" });
        }

        const experience = await prisma.experience.findUnique({
            where: { id },
            select: experienceWithPoster,
        });

        if (!experience) {
            return res.status(404).json({ message: "Experience not found" });
        }

        res.status(200).json(experience);
    } catch (error) {
        console.error("getExperienceById error:", error);
        res.status(500).json({ message: "Error fetching experience" });
    }
};

// GET /api/experiences/user/:userId
// Returns the experiences a single user posted (used on the profile page),
// newest first.
const getExperiencesByUser = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const experiences = await prisma.experience.findMany({
            where: { userId },
            select: experienceWithPoster,
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json(experiences);
    } catch (error) {
        console.error("getExperiencesByUser error:", error);
        res.status(500).json({ message: "Error fetching experiences" });
    }
};

// POST /api/experiences
// Creates a new experience for the logged-in user. jobTitle and description are
// required; images is an optional array of base64 data URLs.
const createExperience = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ message: "Unauthorized user" });
        }

        const { jobTitle, category, customCategory, description, images } = req.body || {};

        const cleanTitle = typeof jobTitle === "string" ? jobTitle.trim() : "";
        const cleanDescription = typeof description === "string" ? description.trim() : "";

        if (!cleanTitle) {
            return res.status(400).json({ message: "Job title is required" });
        }
        if (!cleanDescription) {
            return res.status(400).json({ message: "Description is required" });
        }

        // Default to OTHER if no category (or an invalid one) is provided.
        const cleanCategory = isValidCategory(category) ? category : "OTHER";
        // Only keep the free-text category when the category is OTHER.
        const cleanCustomCategory =
            cleanCategory === "OTHER" && typeof customCategory === "string" && customCategory.trim()
                ? customCategory.trim()
                : null;

        // Only keep string entries so we never store bad data in the array.
        const cleanImages = Array.isArray(images)
            ? images.filter((img) => typeof img === "string" && img.trim())
            : [];

        const experience = await prisma.experience.create({
            data: {
                userId,
                jobTitle: cleanTitle,
                category: cleanCategory,
                customCategory: cleanCustomCategory,
                description: cleanDescription,
                images: cleanImages,
            },
            select: experienceWithPoster,
        });

        res.status(201).json(experience);
    } catch (error) {
        console.error("createExperience error:", error);
        res.status(500).json({ message: "Error creating experience" });
    }
};

module.exports = {
    getExperiences,
    getExperienceById,
    getExperiencesByUser,
    createExperience,
};
