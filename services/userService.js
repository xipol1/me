const User = require('../models/User');

const getUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  } catch (error) {
    throw error;
  }
};

const updateUserProfile = async (userId, updateData) => {
  try {
    // Ensure sensitive fields like password, role, email (if not allowed to change) are not updated this way
    // Or handle them specifically with proper validation and security checks
    const forbiddenUpdates = ['password', 'role', 'email', 'googleId', 'facebookId', 'isVerified', 'wallet'];
    for (const key of forbiddenUpdates) {
      if (updateData[key]) {
        delete updateData[key];
      }
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true });
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  } catch (error) {
    throw error;
  }
};

// Add other user-specific service functions here as needed, e.g.:
// - changePassword
// - requestEmailVerification
// - verifyEmail
// - etc.

// Add this function to userService.js
const getAllUsers = async (queryParams = {}) => {
  try {
    // Basic pagination
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Basic filtering (can be expanded)
    const filter = {};
    if (queryParams.role) filter.role = queryParams.role;
    if (queryParams.status) filter.status = queryParams.status;
    // Add search for name/email if needed

    const users = await User.find(filter)
      .select('-password') // Exclude passwords
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const totalUsers = await User.countDocuments(filter);

    return {
        users,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalCount: totalUsers
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers // Make sure to add it to existing exports.
};
