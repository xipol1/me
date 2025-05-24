const express = require('express');
const router = express.Router();
const transactionService = require('../services/transactionService');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// @route   GET /api/transactions
// @desc    Get transactions for the logged-in user (or all for admin with query)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { transactions, currentPage, totalPages, totalCount } = await transactionService.getTransactionsByUserId(
      req.user.id, 
      req.user.role,
      req.query // Pass query parameters for filtering/pagination
    );
    res.json({ transactions, currentPage, totalPages, totalCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get a specific transaction by ID
// @access  Private (Owner or Admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id, req.user.id, req.user.role);
    res.json(transaction);
  } catch (error) {
    if (error.message.includes('not found')) return res.status(404).json({ message: error.message });
    if (error.message.includes('not authorized')) return res.status(403).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
