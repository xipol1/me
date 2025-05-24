const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
// authorizeRoles is included if you plan to use it soon for admin routes

// @route   GET /api/users/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // req.user should be populated by authenticateToken middleware (e.g., with { id: userId, role: userRole })
    const user = await userService.getUserProfile(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// @route   PUT /api/users/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    res.json({ message: 'Profile updated successfully', user });
  } catch (error)
 {
    res.status(400).json({ message: error.message });
  }
});

// Placeholder for admin routes if needed later, e.g.:
// router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => { ... });
// router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => { ... });
// router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => { ... });

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await userService.getAllUsers(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
