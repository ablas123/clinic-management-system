// ===========================================
// 🔐 AUTHENTICATION CONTROLLER
// ===========================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/generateToken');

const prisma = new PrismaClient();

// ===========================================
// 📝 REGISTER NEW USER
// ===========================================

exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      });
    }

    // 3. Validate password strength (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
        error: 'WEAK_PASSWORD'
      });
    }

    // 4. Validate role
    const validRoles = ['ADMIN', 'DOCTOR', 'STAFF'];
    const userRole = role || 'STAFF';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be ADMIN, DOCTOR, or STAFF',
        error: 'INVALID_ROLE'
      });
    }

    // 5. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        error: 'USER_EXISTS'
      });
    }

    // 6. Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 7. Create user in database
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: userRole
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // 8. Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 9. Send response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🔑 LOGIN USER
// ===========================================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // 3. Check if user exists and verify password
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // 4. Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 5. Send response (exclude password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 👤 GET CURRENT USER PROFILE
// ===========================================

exports.getMe = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🔒 UPDATE PASSWORD
// ===========================================

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // 2. Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
        error: 'WEAK_PASSWORD'
      });
    }

    // 3. Find user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // 4. Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        error: 'INVALID_PASSWORD'
      });
    }

    // 5. Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 6. Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('❌ Update password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// 🚪 LOGOUT (Client-side token removal)
// ===========================================

exports.logout = async (req, res) => {
  // Note: JWT is stateless, logout is handled client-side by removing token
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove token from client storage.'
  });
};
