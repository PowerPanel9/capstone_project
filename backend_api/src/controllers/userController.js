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

        const { id } = req.params;
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }else{
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });
        res.status(200).json(user);
    }
    } catch (error) {
        res.status(500).json({ message: "Error fetching user" });
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {firstName, lastName, imageUrl, bio, skills, addressText,latitude,longitude,resumeUrl, certificationUrl} = req.body;
        const data  = {
            firstName,
            lastName,
            imageUrl,
            bio,
            skills,
            location: {
                latitude,
                longitude,
            },
            resumeUrl,
            certificationsUrl
    
        }
        if (addressText) {
            const {latitude, longitude, locationText} = await forwardGeocode(addressText);
            data.latitude = latitude;
            data.longitude = longitude;
            data.locationText = locationText;
        }

        if (latitude !=null  && longitude !=null) {
            const lat = Number(latitude);
            const lon = Number(longitude);
           if(lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ error: "Invalid latitude/longitude range" });
          }
          data.latitude = lat;
          data.longitude = lon;
          data.locationText = await reverseGeocode(lat, lon);
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
                latitude: true,
                longitude: true,
                locationText: true,
                imageUrl: true,
                resumeUrl: true,
                certificationUrl: true,
              },
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Error updating user" });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
};