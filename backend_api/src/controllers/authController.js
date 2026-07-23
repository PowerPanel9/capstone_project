const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

const register = async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;
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
                password: hashedPassword,
                // Save the chosen role. Falls back to CLIENT if the frontend
                // hasn't sent one yet (safe default until the role picker ships).
                role: role || 'CLIENT'
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
        role: user.role, // Ardelia uses this to route the user and drive the view toggle
    };
};

// Google OAuth: Step 1 - Redirect user to Google login
const googleLogin = (req, res) => {
    // Build the Google authorization URL
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

    const params = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'profile email',
        access_type: 'offline',
        prompt: 'consent'
    });

    // Redirect user to Google's login page
    const url = `${googleAuthUrl}?${params.toString()}`;
    res.redirect(url);
};

// Google OAuth: Step 2 - Handle callback from Google
const googleCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code not provided' });
    }

    try {
        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenResponse.data;

        // Use access token to get user info from Google
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const { id: googleId, email, given_name, family_name, picture } = userInfoResponse.data;

        // Check if user exists in database
        let user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // Create new user if they don't exist
            user = await prisma.user.create({
                data: {
                    firstName: given_name || 'User',
                    lastName: family_name || '',
                    email: email.toLowerCase(),
                    imageUrl: picture || null,
                    authProvider: 'google',
                    password: null // OAuth users don't have passwords
                }
            });
        }

        // Create JWT token for our app
        const token = buildToken(user.id);

        // Redirect user back to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);

    } catch (error) {
        console.error('Google OAuth Error:', error.response?.data || error.message);
        res.redirect(`${process.env.FRONTEND_URL}/auth/failure`);
    }
};

module.exports = { register, login, getMe, logout, googleLogin, googleCallback };
