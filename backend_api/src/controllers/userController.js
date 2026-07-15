const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const { forwardGeocode, reverseGeocode } = require('../utils/geocoder');

const userProfileSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    bio: true,
    skills: true,
    location: true,
    imageUrl: true,
    resumeUrl: true,
    certificationUrl: true,
};

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
const getUserById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: userProfileSelect,
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
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
            imageUrl,
            bio,
            skills,
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
            imageUrl,
            bio,
            skills,
            location: undefined,
            resumeUrl,
            certificationUrl
    
        }
        if (requestedAddress) {
            try {
                const { locationText } = await forwardGeocode(requestedAddress);
                data.location = locationText;
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

        const updatedUser = await prisma.user.update({
            where: { id: authUserId },
            data,
            select: userProfileSelect,
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: "Error updating user" });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
};