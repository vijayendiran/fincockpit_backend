const jwt = require('jsonwebtoken');

// Generate Access Token (short-lived)
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, generateRefreshToken, verifyToken };