const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/security');

const {
    getExperiences,
    getExperienceById,
    getExperiencesByUser,
    createExperience,
} = require('../controllers/experienceController');

// Get every experience (randomized) for the client-mode home feed.
router.get('/', getExperiences);

// Get the experiences a single user posted (for the profile page).
// Must be declared BEFORE "/:id" so "user" is not read as an id.
router.get('/user/:userId', getExperiencesByUser);

// Get a single experience by id (for the detail page).
router.get('/:id', getExperienceById);

// Create a new experience. Only a logged-in user can post one.
router.post('/', requireAuth, createExperience);

module.exports = router;
