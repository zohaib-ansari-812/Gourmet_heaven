const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');

// Register route - using controller
router.post('/register', register);

// Login route - using controller
router.post('/login', login);

// Test route - direct response
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Auth route is working!',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            test: 'GET /api/auth/test'
        }
    });
});

module.exports = router;