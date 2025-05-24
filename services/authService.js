const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Required here for direct comparison if needed, though model handles it too

// Function to generate JWT
const generateToken = (userId, userRole) => {
  return jwt.sign(
    { id: userId, role: userRole },
    process.env.JWT_SECRET || 'fallback_secret_for_jwt_should_be_in_env', // Fallback only for safety, ensure JWT_SECRET is in .env
    { expiresIn: process.env.JWT_EXPIRATION || '1h' } // Fallback, ensure JWT_EXPIRATION is in .env
  );
};

// Function to generate Refresh Token (can be simpler, or a JWT itself with longer expiry)
// For simplicity, using JWT for refresh token as well, but with longer expiry
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_jwt_should_be_in_env', // Separate secret recommended
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );
};

const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    const user = new User(userData);
    await user.save();
    
    // Optionally, generate tokens upon registration directly
    // const token = generateToken(user._id, user.role);
    // const refreshToken = generateRefreshToken(user._id);
    // return { user, token, refreshToken };
    
    // For now, just return user, tokens can be issued on login
    return user; 
  } catch (error) {
    throw error;
  }
};

const loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password
    if (!user) {
      throw new Error('Invalid credentials: User not found.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials: Password incorrect.');
    }
    
    // Update lastLogin timestamp
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token, refreshToken };
  } catch (error) {
    throw error;
  }
};

const refreshToken = async (providedRefreshToken) => {
  try {
    const decoded = jwt.verify(providedRefreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_jwt_should_be_in_env');
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error('Invalid refresh token: User not found.');
    }
    
    // Optionally, implement refresh token reuse detection or rotation here for enhanced security

    const newToken = generateToken(user._id, user.role);
    // Optionally, issue a new refresh token as well
    // const newRefreshToken = generateRefreshToken(user._id);
    
    return { token: newToken /*, refreshToken: newRefreshToken */ };
  } catch (error) {
    throw new Error('Invalid or expired refresh token.');
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  generateToken, // Exporting for potential use elsewhere if needed
  generateRefreshToken
};
