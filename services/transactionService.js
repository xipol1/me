const Transaction = require('../models/Transaction');
const User = require('../models/User'); // May be needed for role checks or specific queries

// Get transactions for a specific user
const getTransactionsByUserId = async (userId, userRole, queryParams = {}) => {
  try {
    let filter = { userId: userId };

    // Admins might be able to see more, or this could be a separate admin service
    if (userRole === 'admin' && queryParams.adminViewAll) {
        filter = {}; // Example: Admin sees all if a specific query param is passed
    } else if (userRole === 'admin' && queryParams.filterUserId) {
        filter = { userId: queryParams.filterUserId };
    } else if (userRole !== 'admin') {
        filter.userId = userId; // Ensure users can only see their own transactions
    }


    // Basic filtering from query params (extend as needed)
    if (queryParams.type) filter.type = queryParams.type;
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.currency) filter.currency = queryParams.currency;
    if (queryParams.dateFrom) filter.createdAt = { ...filter.createdAt, $gte: new Date(queryParams.dateFrom) };
    if (queryParams.dateTo) filter.createdAt = { ...filter.createdAt, $lte: new Date(queryParams.dateTo) };


    // Basic pagination
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .populate('relatedUser', 'name email') // Populate counterparty if exists
      .populate('adId', 'title')
      .populate('channelId', 'name platform')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const totalTransactions = await Transaction.countDocuments(filter);

    return {
        transactions,
        currentPage: page,
        totalPages: Math.ceil(totalTransactions / limit),
        totalCount: totalTransactions
    };
  } catch (error) {
    throw error;
  }
};

// Get a single transaction by its ID (ensure user owns it or is admin)
const getTransactionById = async (transactionId, userId, userRole) => {
  try {
    const transaction = await Transaction.findById(transactionId)
      .populate('userId', 'name email')
      .populate('relatedUser', 'name email')
      .populate('adId', 'title')
      .populate('channelId', 'name platform');
      
    if (!transaction) {
      throw new Error('Transaction not found.');
    }

    // Security check: User can only access their own transaction unless they are an admin
    if (userRole !== 'admin' && transaction.userId._id.toString() !== userId.toString()) {
      // Also check if they are the relatedUser, e.g. a creator receiving funds
      if (!transaction.relatedUser || transaction.relatedUser._id.toString() !== userId.toString()) {
          throw new Error('User not authorized to view this transaction.');
      }
    }
    return transaction;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getTransactionsByUserId,
  getTransactionById
};
