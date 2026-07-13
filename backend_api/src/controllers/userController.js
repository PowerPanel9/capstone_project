const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

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
        const { id } = req.params;
        const {firstName, lastName, imageUrl, bio, skills, location, resumeUrl, certificationUrl} = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                firstname,
                lastname,
                imageUrl,
                bio,
                skills,
                location,
                resumeUrl,
                certificationsUrl,
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