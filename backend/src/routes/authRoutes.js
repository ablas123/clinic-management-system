const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ===========================================
// 🔐 LOGIN (With Role Support)
// ===========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user with role
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: {
        doctorProfile: true,
        labProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is not active. Please contact admin.' 
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token with role
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Prepare user data (without password)
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

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token: token
      }
    });

  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Login failed' 
    });
  }
});

// ===========================================
// 🚪 LOGOUT
// ===========================================
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    // Delete session
    await prisma.session.deleteMany({
      where: { token: token }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: req.user.userId,
        ipAddress: req.ip
      }
    });

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
      include: {
        doctorProfile: true,
        labProfile: true
      }
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

    res.json({ success: true, data: { user: userData } });
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
      { 
        userId: req.user.userId, 
        email: req.user.email, 
        role: req.user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      data: { token: token } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
