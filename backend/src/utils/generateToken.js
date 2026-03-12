// ===========================================
// 🎫 JWT TOKEN GENERATOR UTILITY
// ===========================================

const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token for authenticated users
 * @param {Object} payload - User data to encode in token
 * @param {String} payload.id - User ID
 * @param {String} payload.email - User Email
 * @param {String} payload.role - User Role (ADMIN, DOCTOR, STAFF)
 * @returns {String} JWT Token
 */

const generateToken = (payload) => {
  // Validate payload
  if (!payload || !payload.id || !payload.email || !payload.role) {
    throw new Error('Invalid payload: id, email, and role are required');
  }

  // Generate token with secret and expiration
  const token = jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );

  return token;
};

/**
 * Get token expiration date
 * @param {String} token - JWT Token
 * @returns {Date} Expiration date
 */

const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded ? new Date(decoded.exp * 1000) : null;
  } catch (error) {
    return null;
  }
};

// ===========================================
// 📤 EXPORTS
// ===========================================

module.exports = { generateToken, getTokenExpiration };
