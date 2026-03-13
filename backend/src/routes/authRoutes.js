const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ===========================================
// 🔐 LOGIN
// ===========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
      include: { doctorProfile: true, labProfile: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // ✅ CREATE SESSION: بناء الكائن كاملاً في متغير
    const sessionCreateConfig = {
      data: {
        userId: user.id,
        token: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    };
    await prisma.session.create(sessionCreateConfig);

    // ✅ UPDATE USER: بناء الكائن كاملاً في متغير
    const userUpdateConfig = {
      where: { id: user.id },
      data: {
        lastLogin: new Date()
      }
    };
    await prisma.user.update(userUpdateConfig);

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      doctorProfile: user.doctorProfile,
      labProfile: user.labProfile
    };

    // ✅ RESPONSE: بناء الكائن في متغير
    const loginResponse = {
      success: true,
      message: 'Login successful',
      data: { user: userData, token: token }
    };
    res.json(loginResponse);

  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ success: false, message: e.message || 'Login failed' });
  }
});

// ===========================================
// 🚪 LOGOUT
// ===========================================
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await prisma.session.deleteMany({ where: { token: token } });
    res.json({ success: true, message: 'Logout successful' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 👤 GET CURRENT USER
// ===========================================
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { doctorProfile: true, labProfile: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      lastLogin: user.lastLogin,
      doctorProfile: user.doctorProfile,
      labProfile: user.labProfile
    };
    
    const userResponse = { success: true, data: { user: userData } };
    res.json(userResponse);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===========================================
// 🔄 REFRESH TOKEN
// ===========================================
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const token = jwt.sign(
      { userId: req.user.userId, email: req.user.email, role: req.user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    const refreshResponse = { success: true, data: { token: token } };
    res.json(refreshResponse);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
