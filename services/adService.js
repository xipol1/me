const Ad = require('../models/Ad');
const Channel = require('../models/Channel');
const User = require('../models/User');

// Create a new ad (by an advertiser)
const createAd = async (advertiserId, adData) => {
  try {
    const advertiser = await User.findById(advertiserId);
    if (!advertiser || (advertiser.role !== 'advertiser' && advertiser.role !== 'admin')) {
      throw new Error('User must be an advertiser or admin to create ads.');
    }
    
    const channel = await Channel.findById(adData.channelId);
    if (!channel || channel.status !== 'active' || !channel.isVerified) {
      throw new Error('Channel not found, not active, or not verified.');
    }

    // TODO: Validate adType against channel.rates and set price accordingly, or check provided price.
    // For now, assumes price is provided correctly.

    const newAd = new Ad({
      ...adData,
      advertiserId: advertiserId,
      status: 'pending_approval' // Initial status when advertiser submits
    });
    await newAd.save();
    // TODO: Notify creator about the new ad request
    return newAd;
  } catch (error) {
    throw error;
  }
};

// Get a single ad by its ID
const getAdById = async (adId) => {
  try {
    const ad = await Ad.findById(adId)
      .populate('advertiserId', 'name email')
      .populate('channelId', 'name platform handle');
    if (!ad) {
      throw new Error('Ad not found.');
    }
    return ad;
  } catch (error) {
    throw error;
  }
};

// Get ads (filter can be by advertiserId, channelId, status, etc.)
const getAds = async (filter = {}) => {
  try {
    const ads = await Ad.find(filter)
      .populate('advertiserId', 'name email')
      .populate('channelId', 'name platform');
    return ads;
  } catch (error) {
    throw error;
  }
};

// Update an ad (e.g., by advertiser if draft, or by creator/admin for status changes)
const updateAd = async (adId, userId, userRole, updateData) => {
  try {
    const ad = await Ad.findById(adId);
    if (!ad) {
      throw new Error('Ad not found.');
    }

    // Basic ownership/permission check (can be more granular)
    if (userRole !== 'admin' && ad.advertiserId.toString() !== userId.toString() && ad.channelData.userId.toString() !== userId.toString() ) {
        // Assuming ad.channelData.userId is populated or fetched to check channel owner
        // This part needs refinement based on who can update what and when.
        // For now, only advertiser can update if it's a draft.
        if (ad.status !== 'draft' || ad.advertiserId.toString() !== userId.toString()) {
             throw new Error('User not authorized to update this ad or ad is not in a modifiable state.');
        }
    }
    
    // Prevent direct status updates by advertiser if not draft, price changes, etc.
    // Status changes should go through specific service methods like approveAd, rejectAd.
    if (userRole !== 'admin' && ad.advertiserId.toString() === userId.toString()) {
        if (ad.status !== 'draft' && ad.status !== 'requires_modification') {
            delete updateData.status; 
        }
        delete updateData.price; // Price should be agreed upon
        delete updateData.rejectionReason;
    }


    Object.assign(ad, updateData);
    await ad.save();
    return ad;
  } catch (error) {
    throw error;
  }
};

// --- Ad Workflow Actions ---

// Creator approves an ad
const approveAd = async (adId, creatorId) => {
    const ad = await Ad.findById(adId).populate('channelId');
    if (!ad) throw new Error('Ad not found.');
    if (ad.channelId.userId.toString() !== creatorId.toString()) {
        throw new Error('User not authorized to approve this ad.');
    }
    if (ad.status !== 'pending_approval' && ad.status !== 'requires_modification') {
        throw new Error('Ad is not in a state that can be approved.');
    }
    ad.status = 'approved'; // Or 'scheduled' if scheduledDate is set and payment confirmed (later)
    // TODO: Notify advertiser
    await ad.save();
    return ad;
};

// Creator rejects an ad
const rejectAd = async (adId, creatorId, reason) => {
    const ad = await Ad.findById(adId).populate('channelId');
    if (!ad) throw new Error('Ad not found.');
     if (ad.channelId.userId.toString() !== creatorId.toString()) {
        throw new Error('User not authorized to reject this ad.');
    }
    if (ad.status !== 'pending_approval' && ad.status !== 'requires_modification') {
        throw new Error('Ad is not in a state that can be rejected.');
    }
    ad.status = 'rejected';
    ad.rejectionReason = reason || 'Rejected by creator.';
    // TODO: Notify advertiser
    await ad.save();
    return ad;
};

// Creator requests modification for an ad
const requestAdModification = async (adId, creatorId, message) => {
    const ad = await Ad.findById(adId).populate('channelId');
    if (!ad) throw new Error('Ad not found.');
     if (ad.channelId.userId.toString() !== creatorId.toString()) {
        throw new Error('User not authorized to request modifications for this ad.');
    }
    if (ad.status !== 'pending_approval') {
        throw new Error('Ad is not in pending_approval state.');
    }
    ad.status = 'requires_modification';
    ad.modificationRequests.push({ requestedBy: creatorId, message: message });
    // TODO: Notify advertiser
    await ad.save();
    return ad;
};


// Delete an ad (typically only if in draft or by admin)
const deleteAd = async (adId, userId, userRole) => {
  try {
    const ad = await Ad.findById(adId);
    if (!ad) {
      throw new Error('Ad not found.');
    }
    // Check permissions: only advertiser if draft, or admin
    if (userRole !== 'admin' && (ad.advertiserId.toString() !== userId.toString() || ad.status !== 'draft')) {
      throw new Error('User not authorized to delete this ad or ad is not in draft state.');
    }
    await Ad.findByIdAndDelete(adId);
    return { message: 'Ad deleted successfully.' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createAd,
  getAdById,
  getAds,
  updateAd,
  approveAd,
  rejectAd,
  requestAdModification,
  deleteAd
  // Other ad specific services: scheduleAd, markAsPublished, recordPerformance, etc.
};
