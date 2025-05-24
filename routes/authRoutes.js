const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const passport = require('passport'); // Will be used later for logout if session-based, or for specific strategies

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Basic validation (more robust validation should be added, e.g., using Joi or express-validator)
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    // Role validation can also be added if specific roles are allowed during registration
    
    const user = await authService.registerUser({ name, email, password, role });
    // Exclude password from the response
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json({ message: 'User registered successfully', user: userResponse });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return JWT
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const { user, token, refreshToken } = await authService.loginUser(email, password);
    // In a real app, refreshToken might be set in an HttpOnly cookie for security
    res.json({ message: 'Login successful', user, token, refreshToken });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token using refresh token
// @access  Public (requires valid refresh token)
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }
    const tokens = await authService.refreshToken(refreshToken);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (e.g., invalidate refresh token if stored server-side, or client clears tokens)
// @access  Private (requires authentication to know who is logging out)
// For a JWT-based stateless auth, true logout is mostly client-side (deleting tokens).
// If refresh tokens are stored server-side, this endpoint could invalidate it.
router.post('/logout', (req, res) => {
  // Example: If you were storing refresh tokens in DB associated with user
  // const userId = req.user.id; // Assuming authentication middleware populates req.user
  // await authService.invalidateRefreshTokenForUser(userId); 
  // For now, a simple message as tokens are managed client-side primarily
  res.json({ message: 'Logout successful. Please clear your tokens client-side.' });
});

module.exports = router;
