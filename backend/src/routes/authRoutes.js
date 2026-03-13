const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ مسار صحيح: ../../middleware/auth
const { authenticate } = require('../../middleware/auth');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ===========================================
// 🔐 LOGIN
// ===========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
      include: { doctorProfile: true, labProfile: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
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

    await prisma.session.create({
       {
        userId: user.id,
        token: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    await prisma.user.update({
      where: { id: user.id },
       { lastLogin: new Date() }
    });

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      doctorProfile: user.doctorProfile ? {
        id: user.doctorProfile.id,
        specialty: user.doctorProfile.specialty,
        isAvailable: user.doctorProfile.isAvailable
      } : null,
      labProfile: user.labProfile ? {
        id: user.labProfile.id,
        specialization: user.labProfile.specialization
      } : null
    };

    // ✅ استخدام متغير لتجنب مشكلة :
    const responseData = {
      success: true,
      message: 'Login successful',
       { user: userData, token: token }
    };
    res.json(responseData);

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
    
    const responseData = { success: true, message: 'Logout successful' };
    res.json(responseData);
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

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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

    // ✅ استخدام متغير لتجنب مشكلة :
    const responseData = { success: true,  { user: userData } };
    res.json(responseData);
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
    
    // ✅ استخدام متغير لتجنب مشكلة :
    const responseData = { success: true,  { token: token } };
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
