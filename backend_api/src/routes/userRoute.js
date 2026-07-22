const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/security');

const {
    getUsers,
    getProviders,
    getUserById,
    getUserByName,
    updateUser,
} = require('../controllers/userController');

// Get all users
router.get('/', getUsers);

// Get a randomized list of providers for the client-mode home feed.
// Must be declared BEFORE "/:id" so "providers" is not read as an id.
router.get('/providers', getProviders);

// Get a user by id
router.get('/:id', getUserById);

// Get a user by name
router.get('/name/:name', getUserByName);

// Update a user
router.put('/:id', requireAuth, updateUser);

module.exports = router;