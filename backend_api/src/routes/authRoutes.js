const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, googleLogin, googleCallback } = require('../controllers/authController');
const { requireAuth } = require('../middleware/security');


router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

// Google OAuth routes
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);


module.exports = router;