const express = require('express');
const router = express.Router();
const statisticsService = require('../services/statisticsService');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// @route   GET /api/statistics/admin-dashboard
// @desc    Get dashboard statistics for admin
// @access  Private (Admin)
router.get('/admin-dashboard', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const stats = await statisticsService.getAdminDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/statistics/creator-dashboard
// @desc    Get dashboard statistics for a creator
// @access  Private (Creator)
router.get('/creator-dashboard', authenticateToken, authorizeRoles('creator', 'admin'), async (req, res) => {
    // Admin can also access for specific user if needed, or this is strictly for logged-in creator
    if (req.user.role === 'admin' && req.query.creatorId) {
        // Allow admin to fetch for a specific creator
         try {
            const stats = await statisticsService.getCreatorDashboardStats(req.query.creatorId);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } else if (req.user.role === 'creator') {
        try {
            const stats = await statisticsService.getCreatorDashboardStats(req.user.id);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } else {
        res.status(403).json({ message: 'Forbidden: Insufficient role or missing parameters for admin view.' });
    }
});

// Add advertiser dashboard stats route similarly

module.exports = router;
