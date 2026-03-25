const express = require('express');
const { register, login, getMe, updateMe, refreshToken, logout, verifyEmail } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

// Public routes
router.post('/signup', signupLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/verify-email', verifyEmail);

// authMiddlewareed routes (requires authentication)
router.get('/me', authMiddleware, getMe);
router.put('/update', authMiddleware, updateMe);

module.exports = router;
