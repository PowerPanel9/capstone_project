const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const { forwardGeocode, reverseGeocode, getAddressSuggestions } = require('../utils/geocoder');
const { extractCityStateFromLocation } = require('../utils/location');
const stripe = require('../utils/stripe');

const userProfileSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    categories: true,
    bio: true,
    skills: true,
    location: true,
    contactEmail: true,
    phoneNumber: true,
    mailingAddress: true,
    profilePicture: true,
    imageUrl: true,
    resumeUrl: true,
    certificationUrl: true,
    stripeAccountId: true,
};

const legacyUserProfileSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    categories: true,
    bio: true,
    skills: true,
    location: true,
    profilePicture: true,
    imageUrl: true,
    resumeUrl: true,
    certificationUrl: true,
    stripeAccountId: true,
};

function isUnknownPrismaFieldError(error) {
    const message = typeof error?.message === "string" ? error.message : "";
    return Boolean(
        error &&
        error.name === "PrismaClientValidationError" &&
        (message.includes("Unknown field") || message.includes("Unknown argument"))
    );
}


function withCityState(user, explicitCity, explicitState) {
    if (!user) return user;
    const parsed = extractCityStateFromLocation(user.location);
    return {
        ...user,
        city: explicitCity || parsed.city || "",
        state: explicitState || parsed.state || "",
    };
}

const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                id: 'asc'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

const providerCardSelect = {
    id: true,
    firstName: true,
    lastName: true,
    profilePicture: true,
    imageUrl: true,
    categories: true,
    skills: true,
};

const PROVIDER_CATEGORY_VALUES = [
    "CLEANING", "TUTORING", "PLUMBING", "GARDENING", "BEAUTY",
    "BABYSITTING", "MOVING", "HANDYMAN", "DELIVERY", "OTHER",
];

const getProviders = async (req, res) => {
    try {
        const where = {
            role: { in: ["PROVIDER", "BOTH"] },
        };

        const excludeId = Number(req.query.excludeId);
        if (Number.isInteger(excludeId) && excludeId > 0) {
            where.id = { not: excludeId };
        }

        const category = req.query.category;
        if (typeof category === "string" && category.trim()) {
            const normalizedCategory = category.trim();
            where.OR = [
                { categories: { has: normalizedCategory } },
                { skills: { has: normalizedCategory } },
            ];
        }

        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

        let users;
        try {
            users = await prisma.user.findMany({
                where,
                select: providerCardSelect,
            });
        } catch (queryError) {
            if (!isUnknownPrismaFieldError(queryError)) throw queryError;
            const legacyWhere = {
                role: { in: ["PROVIDER", "BOTH"] },
            };
            if (Number.isInteger(excludeId) && excludeId > 0) {
                legacyWhere.id = { not: excludeId };
            }
            if (typeof category === "string" && category.trim()) {
                legacyWhere.skills = { has: category.trim() };
            }
            users = await prisma.user.findMany({
                where: legacyWhere,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                    imageUrl: true,
                    skills: true,
                },
            });
        }

        // Search by name OR by skill text (case-insensitive, partial match).
        // Example: "plumb" matches "Plumbing"; "math" matches "Math Tutor".
        if (search) {
            const needle = search.toLowerCase();
            const matchedCategories = PROVIDER_CATEGORY_VALUES.filter((value) =>
                value.toLowerCase().includes(needle) || value.replace("_", " ").toLowerCase().includes(needle)
            );
            users = users.filter((user) => {
                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
                const nameMatch = fullName.includes(needle);
                const skillMatch = Array.isArray(user.skills)
                    && user.skills.some((skill) => String(skill || "").toLowerCase().includes(needle));
                const categoryMatch = Array.isArray(user.categories)
                    && user.categories.some((value) => matchedCategories.includes(String(value || "").toUpperCase()));
                return nameMatch || skillMatch || categoryMatch;
            });
        }

        // Shuffle so the feed shows different providers each time (Fisher–Yates).
        for (let i = users.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [users[i], users[j]] = [users[j], users[i]];
        }

        res.status(200).json(users);
    } catch (error) {
        console.error("getProviders error:", error);
        res.status(500).json({ message: "Error fetching providers" });
    }
};
// Search users by name. Returns a LIST of every user whose first OR last name
// contains the search text (case-insensitive). An empty list just means no
// matches were found, so the frontend can show a "no results" message.
const getUserByName = async (req, res) => {
    try {
        const {name} = req.params;
        const where = {
            OR: [
                {firstName: {contains: name, mode: 'insensitive'}},
                {lastName: {contains: name, mode: 'insensitive'}},
            ]
        };

        let users;
        try {
            users = await prisma.user.findMany({
                where,
                select: userProfileSelect,
                orderBy: { firstName: 'asc' },
            });
        } catch (selectError) {
            if (!isUnknownPrismaFieldError(selectError)) throw selectError;
            users = await prisma.user.findMany({
                where,
                select: legacyUserProfileSelect,
                orderBy: { firstName: 'asc' },
            });
        }

        res.status(200).json(users);
    } catch (error) {
        console.error("getUserByName error:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
};
const getUserById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        let user;
        try {
            user = await prisma.user.findUnique({
                where: { id },
                select: userProfileSelect,
            });
        } catch (selectError) {
            if (!isUnknownPrismaFieldError(selectError)) throw selectError;
            user = await prisma.user.findUnique({
                where: { id },
                select: legacyUserProfileSelect,
            });
        }
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compute a public "paymentVerified" flag: true if this user has a Stripe
        // account with payouts enabled. We check Stripe live only when an account
        // id exists, and never expose the raw stripeAccountId to clients.
        const { stripeAccountId, ...publicUser } = user;
        let paymentVerified = false;
        if (stripeAccountId) {
            try {
                const account = await stripe.accounts.retrieve(stripeAccountId);
                paymentVerified = Boolean(account.payouts_enabled);
            } catch (stripeErr) {
                console.error("Could not check payout status for user", id, stripeErr.message);
            }
        }

        res.status(200).json(
            withCityState({
                contactEmail: "",
                phoneNumber: "",
                mailingAddress: "",
                ...publicUser,
                paymentVerified,
            })
        );
    } catch (error) {
        console.error("getUserById error:", error);
        res.status(500).json({ message: "Error fetching user" });
    }
};

const updateUser = async (req, res) => {
    try {
        const paramUserId = Number(req.params.id);
        const authUserId = req.user?.userId;

        if (!Number.isInteger(paramUserId) || paramUserId <= 0) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        if (!Number.isInteger(authUserId) || authUserId <= 0) {
            return res.status(401).json({ message: "Unauthorized user" });
        }

        if (authUserId !== paramUserId) {
            return res.status(403).json({ message: "You can only update your own profile" });
        }

        const {
            firstName,
            lastName,
            profilePicture,
            imageUrl,
            bio,
            skills,
            categories,
            contactEmail,
            phoneNumber,
            mailingAddress,
            addressText,
            location,
            latitude,
            longitude,
            resumeUrl,
            certificationUrl,
            role
        } = req.body || {};

        // The onboarding role picker sends the chosen role here. Only accept
        // the values our UserRole enum allows so a bad value can't be saved.
        const allowedRoles = ["CLIENT", "PROVIDER", "BOTH"];
        if (role !== undefined && !allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }
        const allowedCategories = [
            "CLEANING", "TUTORING", "PLUMBING", "GARDENING", "BEAUTY",
            "BABYSITTING", "MOVING", "HANDYMAN", "DELIVERY", "OTHER",
        ];
        if (categories !== undefined) {
            if (!Array.isArray(categories)) {
                return res.status(400).json({ message: "categories must be an array" });
            }
            const invalidCategory = categories.find((value) => !allowedCategories.includes(value));
            if (invalidCategory) {
                return res.status(400).json({ message: `Invalid category: ${invalidCategory}` });
            }
        }
        const requestedAddress =
            typeof addressText === "string" && addressText.trim()
                ? addressText.trim()
                : (typeof location === "string" ? location.trim() : "");

        const data  = {
            firstName,
            lastName,
            profilePicture,
            imageUrl,
            bio,
            skills,
            categories,
            contactEmail: typeof contactEmail === "string" && contactEmail.trim() ? contactEmail.trim() : null,
            phoneNumber: typeof phoneNumber === "string" && phoneNumber.trim() ? phoneNumber.trim() : null,
            mailingAddress: typeof mailingAddress === "string" && mailingAddress.trim() ? mailingAddress.trim() : null,
            location: undefined,
            resumeUrl,
            certificationUrl

        }
        // Only change the role when the request actually sent one, so saving
        // other fields (like bio) never overwrites the user's chosen role.
        if (role !== undefined) {
            data.role = role;
        }
        let derivedCity = "";
        let derivedState = "";
        if (requestedAddress) {
            // Only re-geocode when the address text actually changed. The
            // profile form re-sends the currently loaded location on every
            // save (even ones that only change, say, a skill), and re-running
            // the SAME address through LocationIQ can come back with a
            // slightly different formatted string (e.g. an extra neighborhood
            // name). That made the displayed city/state drift on every save
            // that didn't even touch location. Skipping the geocode when
            // nothing changed keeps the stored address (and its city/state)
            // stable.
            const existingUser = await prisma.user.findUnique({
                where: { id: authUserId },
                select: { location: true },
            });

            if (requestedAddress !== existingUser?.location) {
                try {
                    const { locationText, city, state } = await forwardGeocode(requestedAddress);
                    data.location = locationText;
                    derivedCity = city || "";
                    // Always store the 2-letter code so the profile shows "CA", not
                    // "California" (LocationIQ may return the full name here).
                    derivedState = normalizeStateToCode(state);
                } catch (geocodeError) {
                    // Keep profile updates working even if geocoding is unavailable.
                    data.location = requestedAddress;
                }
            }
        }

        if (latitude !=null  && longitude !=null) {
            const lat = Number(latitude);
            const lon = Number(longitude);
           if(lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return res.status(400).json({ error: "Invalid latitude/longitude range" });
          }
          data.location = await reverseGeocode(lat, lon);
        }

        let updatedUser;
        try {
            updatedUser = await prisma.user.update({
                where: { id: authUserId },
                data,
                select: userProfileSelect,
            });
        } catch (updateError) {
            if (!isUnknownPrismaFieldError(updateError)) throw updateError;
            // Only strip the fields that may not exist in older databases
            // (the contact fields). `categories` DOES exist once the
            // add_user_categories migration has run, so we keep it here — that
            // is what the onboarding services step saves.
            const {
                contactEmail: _contactEmail,
                phoneNumber: _phoneNumber,
                mailingAddress: _mailingAddress,
                ...legacyData
            } = data;
            updatedUser = await prisma.user.update({
                where: { id: authUserId },
                data: legacyData,
                select: legacyUserProfileSelect,
            });
        }
        res.status(200).json(
            withCityState(
                {
                    contactEmail: "",
                    phoneNumber: "",
                    mailingAddress: "",
                    ...updatedUser,
                },
                derivedCity,
                derivedState
            )
        );
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: "Error updating user" });
    }
};

// Return a short list of address suggestions for what the user typed.
// The frontend calls this while the user types so it can show a dropdown of
// real, valid addresses to pick from. We keep the LocationIQ key on the server
// (never send it to the browser), so the frontend asks us instead of LocationIQ.
const getAddressOptions = async (req, res) => {
    try {
        const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

        // LocationIQ needs at least a couple of characters to return useful
        // matches. For very short input we just return an empty list.
        if (query.length < 3) {
            return res.status(200).json([]);
        }

        const suggestions = await getAddressSuggestions(query);
        res.status(200).json(suggestions);
    } catch (error) {
        console.error("getAddressOptions error:", error.message);
        res.status(500).json({ message: "Could not fetch address suggestions" });
    }
};

module.exports = {
    getUsers,
    getProviders,
    getUserById,
    getUserByName,
    updateUser,
    getAddressOptions,
};