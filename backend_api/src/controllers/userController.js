const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const { forwardGeocode, reverseGeocode } = require('../utils/geocoder');

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
        const userId = req.user?.userId ?? Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ message: "Invalid user id" });
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
        const requestedAddress = addressText || location;

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
            const { locationText } = await forwardGeocode(requestedAddress);
            data.location = locationText;
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
            where: { id: userId },
            data,
            select: {
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
              },
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