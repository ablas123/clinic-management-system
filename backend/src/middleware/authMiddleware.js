// ===========================================
// 🔐 AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ===========================================

const jwt = require('jsonwebtoken');

// ===========================================
// 🛡️ PROTECT ROUTES (Verify JWT Token)
// ===========================================

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify token using secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Attach user info to request object
      // Note: decoded contains { id, email, role } from the token
      req.user = decoded;

      // 5. Move to next middleware/controller
      next();
      
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired, please login again',
          error: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token',
        error: 'INVALID_TOKEN'
      });
    }
  }

  // 6. No token found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
      error: 'NO_TOKEN'
    });
  }
};

// ===========================================
// 👑 AUTHORIZE ROLES (Check User Role)
// ===========================================

const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (attached by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        error: 'NO_USER'
      });
    }

    // Check if user role is included in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
        error: 'FORBIDDEN'
      });
    }

    next();
  };
};

// ===========================================
// 📤 EXPORTS
// ===========================================

module.exports = { protect, authorize };
