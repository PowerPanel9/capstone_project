const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const { forwardGeocode, reverseGeocode } = require('../utils/geocoder');
const stripe = require('../utils/stripe');

const userProfileSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
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

function extractCityStateFromLocation(locationValue) {
    if (!locationValue || typeof locationValue !== "string") {
        return { city: "", state: "" };
    }

    const parts = locationValue
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

    const US_STATE_NAMES_TO_CODE = {
        alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
        colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
        hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
        kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
        massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
        montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
        "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
        ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
        "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
        vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
        wyoming: "WY",
    };
    const streetLikePattern =
        /\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|way|court|ct|place|pl)\b/i;
    const nonCityPattern =
        /\b(county|parish|region|district|state|country|usa|united states)\b/i;
    const parseStateCode = (value) => {
        const trimmed = value.trim();
        const abbrMatch = trimmed.match(/\b([A-Z]{2})\b/);
        if (abbrMatch) return abbrMatch[1];
        return US_STATE_NAMES_TO_CODE[trimmed.toLowerCase()] || "";
    };

    // Example: "5867 Fremont Street, Golden Gate, Oakland, Alameda County, California, 94608, USA"
    for (let i = 0; i < parts.length; i += 1) {
        const state = parseStateCode(parts[i]);
        if (!state) continue;
        for (let j = i - 1; j >= 0; j -= 1) {
            const candidate = parts[j].replace(/\d+/g, "").trim();
            if (!candidate) continue;
            if (streetLikePattern.test(candidate)) continue;
            if (nonCityPattern.test(candidate)) continue;
            return { city: candidate, state };
        }
    }

    // Example fallback: "Street, City ST 12345"
    if (parts.length >= 2) {
        const cityStateZipMatch = parts[1].match(/^(.+?)\s+([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/);
        if (cityStateZipMatch) {
            return {
                city: cityStateZipMatch[1].trim(),
                state: cityStateZipMatch[2].trim(),
            };
        }
    }

    return { city: "", state: "" };
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

// Get all users
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                id: 'asc'
            },
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

// Only the public fields the "browse providers" cards need. This keeps
// private data (password, email, address, phone) out of the response.
const providerCardSelect = {
    id: true,
    firstName: true,
    lastName: true,
    profilePicture: true,
    imageUrl: true,
    skills: true,
};

// Get a randomized list of providers for the client-mode home feed.
// Only users whose role is PROVIDER or BOTH are returned (a CLIENT-only user
// doesn't offer services, so they shouldn't show up here).
// Optionally:
//   ?excludeId=<id>       leaves the logged-in user out of the list.
//   ?category=CLEANING    keeps only providers who list that skill/service.
const getProviders = async (req, res) => {
    try {
        // Start by requiring the user to actually be a provider.
        const where = {
            role: { in: ["PROVIDER", "BOTH"] },
        };

        // Leave the logged-in user out of their own results, if asked.
        const excludeId = Number(req.query.excludeId);
        if (Number.isInteger(excludeId) && excludeId > 0) {
            where.id = { not: excludeId };
        }

        // When a category is chosen (from a category tile), keep only providers
        // whose skills list includes that service. `has` checks the skills array.
        const category = req.query.category;
        if (typeof category === "string" && category.trim()) {
            where.skills = { has: category.trim() };
        }

        const users = await prisma.user.findMany({
            where,
            select: providerCardSelect,
        });

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
            contactEmail,
            phoneNumber,
            mailingAddress,
            addressText,
            location,
            latitude,
            longitude,
            resumeUrl,
            certificationUrl
        } = req.body || {};
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
            contactEmail: typeof contactEmail === "string" && contactEmail.trim() ? contactEmail.trim() : null,
            phoneNumber: typeof phoneNumber === "string" && phoneNumber.trim() ? phoneNumber.trim() : null,
            mailingAddress: typeof mailingAddress === "string" && mailingAddress.trim() ? mailingAddress.trim() : null,
            location: undefined,
            resumeUrl,
            certificationUrl
    
        }
        let derivedCity = "";
        let derivedState = "";
        if (requestedAddress) {
            try {
                const { locationText, city, state } = await forwardGeocode(requestedAddress);
                data.location = locationText;
                derivedCity = city || "";
                derivedState = state || "";
            } catch (geocodeError) {
                // Keep profile updates working even if geocoding is unavailable.
                data.location = requestedAddress;
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

module.exports = {
    getUsers,
    getProviders,
    getUserById,
    getUserByName,
    updateUser,
};