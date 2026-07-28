const express = require('express');
const router = express.Router();
const { register, login, checkEmail, getMe, logout, googleLogin, googleCallback } = require('../controllers/authController');
const { requireAuth } = require('../middleware/security');


router.post('/register', register);
router.post('/login', login);
// Public check the signup form uses before sending a verification code.
router.get('/check-email', checkEmail);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

// Google OAuth routes
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);


module.exports = router;