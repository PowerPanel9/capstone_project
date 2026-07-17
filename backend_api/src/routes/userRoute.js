const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/security');

const {
    getUsers,
    getUserById,
    updateUser,
} = require('../controllers/userController');

// Get all users
router.get('/', getUsers);

// Get a user by id
router.get('/:id', getUserById);

// Update a user
router.put('/:id', requireAuth, updateUser);

module.exports = router;