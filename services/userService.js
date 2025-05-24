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

module.exports = {
  getUserProfile,
  updateUserProfile
};
