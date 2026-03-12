// ===========================================
// 🔐 AUTHENTICATION ROUTES
// ===========================================

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  logout
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ===========================================
// 📍 PUBLIC ROUTES (No Authentication Required)
// ===========================================

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// ===========================================
// 🔒 PROTECTED ROUTES (Authentication Required)
// ===========================================

// GET /api/auth/me - Get current user profile
router.get('/me', protect, getMe);

// PUT /api/auth/update-password - Update user password
router.put('/update-password', protect, updatePassword);

// POST /api/auth/logout - Logout user
router.post('/logout', protect, logout);

// ===========================================
// 👑 ADMIN ONLY ROUTES
// ===========================================

// Example: Get all users (Admin only)
// router.get('/users', protect, authorize('ADMIN'), getAllUsers);

// ===========================================
// 📤 EXPORT ROUTER
// ===========================================

module.exports = router;
