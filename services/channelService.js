const Channel = require('../models/Channel');
const User = require('../models/User'); // To verify creator role

// Create a new channel
const createChannel = async (userId, channelData) => {
  try {
    const creator = await User.findById(userId);
    if (!creator || (creator.role !== 'creator' && creator.role !== 'admin')) {
      throw new Error('User must be a creator or admin to create channels.');
    }

    // Check for duplicate handle on the same platform
    const existingChannel = await Channel.findOne({ 
      handle: channelData.handle, 
      platform: channelData.platform 
    });
    if (existingChannel) {
      throw new Error(`A channel with handle '${channelData.handle}' already exists on platform '${channelData.platform}'.`);
    }

    const newChannel = new Channel({
      ...channelData,
      userId: userId, // Assign creator
      status: 'pending_verification' // Default status
    });
    await newChannel.save();
    return newChannel;
  } catch (error) {
    throw error;
  }
};

// Get a single channel by its ID
const getChannelById = async (channelId) => {
  try {
    const channel = await Channel.findById(channelId).populate('userId', 'name email'); // Populate creator info
    if (!channel) {
      throw new Error('Channel not found.');
    }
    return channel;
  } catch (error) {
    throw error;
  }
};

// Get all channels by a specific user
const getChannelsByUserId = async (userId) => {
  try {
    const channels = await Channel.find({ userId });
    return channels;
  } catch (error) {
    throw error;
  }
};

// Get all channels with optional filtering (basic example)
const getAllChannels = async (filter = {}) => {
  try {
    // Add more sophisticated filtering/pagination/sorting as needed
    const channels = await Channel.find(filter).populate('userId', 'name email');
    return channels;
  } catch (error) {
    throw error;
  }
};

// Update a channel
const updateChannel = async (channelId, userId, updateData) => {
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new Error('Channel not found.');
    }
    // Ensure the user updating is the owner or an admin
    if (channel.userId.toString() !== userId.toString() /* && !isAdmin(userId) */) {
      throw new Error('User not authorized to update this channel.');
    }

    // Prevent updating certain fields directly, e.g., userId, isVerified (admin only)
    delete updateData.userId;
    delete updateData.isVerified; 
    delete updateData.status; // Status should be updated by specific actions (verify, suspend)

    Object.assign(channel, updateData);
    await channel.save();
    return channel;
  } catch (error) {
    throw error;
  }
};

// Delete a channel (or mark as inactive)
const deleteChannel = async (channelId, userId) => {
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new Error('Channel not found.');
    }
    if (channel.userId.toString() !== userId.toString() /* && !isAdmin(userId) */) {
      throw new Error('User not authorized to delete this channel.');
    }
    // Instead of deleting, consider marking as inactive:
    // channel.status = 'inactive';
    // await channel.save();
    // return { message: 'Channel marked as inactive.' };
    
    await Channel.findByIdAndDelete(channelId);
    return { message: 'Channel deleted successfully.' };
  } catch (error) {
    throw error;
  }
};

// --- Rate Management ---
const addRateToChannel = async (channelId, userId, rateData) => {
    // Similar ownership checks as updateChannel
    const channel = await Channel.findById(channelId);
    if (!channel || channel.userId.toString() !== userId.toString()) {
        throw new Error('Channel not found or user not authorized.');
    }
    channel.rates.push(rateData);
    await channel.save();
    return channel;
};

const updateRateInChannel = async (channelId, userId, rateId, rateUpdateData) => {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.userId.toString() !== userId.toString()) {
        throw new Error('Channel not found or user not authorized.');
    }
    const rate = channel.rates.id(rateId);
    if (!rate) {
        throw new Error('Rate not found.');
    }
    Object.assign(rate, rateUpdateData);
    await channel.save();
    return channel;
};

const deleteRateFromChannel = async (channelId, userId, rateId) => {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.userId.toString() !== userId.toString()) {
        throw new Error('Channel not found or user not authorized.');
    }
    channel.rates.id(rateId).remove();
    await channel.save();
    return channel;
};


// --- Verification --- (Placeholder logic)
const verifyChannel = async (channelId /*, adminUserId */) => {
  try {
    // In a real app, only an admin should do this
    // const admin = await User.findById(adminUserId);
    // if(!admin || admin.role !== 'admin') throw new Error('Unauthorized');

    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new Error('Channel not found.');
    }
    // Add actual verification logic here (e.g., checking a code, API validation)
    channel.isVerified = true;
    channel.status = 'active';
    channel.verificationDetails = { method: 'manual_admin', verifiedAt: new Date(), notes: 'Verified by admin.'};
    await channel.save();
    return channel;
  } catch (error) {
    throw error;
  }
};


module.exports = {
  createChannel,
  getChannelById,
  getChannelsByUserId,
  getAllChannels,
  updateChannel,
  deleteChannel,
  addRateToChannel,
  updateRateInChannel,
  deleteRateFromChannel,
  verifyChannel
  // Other channel specific services: listTopChannels, searchChannels, etc.
};
