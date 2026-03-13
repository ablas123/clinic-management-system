const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ===========================================
// 🔐 AUTHENTICATE (Verify JWT)
// ===========================================
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { token: token }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expired. Please login again.' 
      });
    }

    // Check user status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account not active' 
      });
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// ===========================================
// 🔑 AUTHORIZE (Check Role Permissions)
// ===========================================
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'READ',
          entityType: 'Unauthorized',
          entityId: req.path,
          ipAddress: req.ip,
          details: `Role ${req.user.role} tried to access ${req.path}`
        }
      }).catch(() => {});

      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// ===========================================
// 📝 AUDIT LOG HELPER
// ===========================================
const auditLog = async (req, action, entityType, entityId, details = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId || 'anonymous',
        action: action,
        entityType: entityType,
        entityId: entityId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: details
      }
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
};

module.exports = { 
  authenticate, 
  authorize, 
  auditLog 
};
