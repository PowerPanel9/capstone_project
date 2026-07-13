const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

const register = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "First Name, Last Name, email, username, and password are required" });
      }
    
      if (password.length < MIN_PASSWORD_LENGTH) {
        return res
          .status(400)
          .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
      }
    
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: "JWT_SECRET is not configured" });
      }

      try {
        const normalizedFirstName = firstName.trim().toLowerCase();
        const normalizedLastName = lastName.trim().toLowerCase();
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });
        
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                firstName: normalizedFirstName,
                lastName: normalizedLastName,
                email: normalizedEmail,
                password: hashedPassword
            }
        });

        const token = buildToken(user.id);
        return res.status(201).json({token, user: makeUserPublic(user)});
      } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({error: "Email and password are required"});
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({error: "JWT_SECRET is not configured"});
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user) {
            return res.status(401).json({error: "Invalid credentials"});
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({error: "Invalid credentials"});
        }

        const token = buildToken(user.id);
        return res.status(200).json({token, user: makeUserPublic(user)});
      } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({error: "Internal server error"});
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(makeUserPublic(user));
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const logout = async (req, res) => {
    return res.status(200).json({message: "Logged out successfully"});
};  

const buildToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '10d' });
};

const makeUserPublic = (user) => {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    };
};

module.exports = { register, login, getMe, logout };
