// services/statisticsService.js
const mongoose = require('mongoose'); // Added mongoose require
const User = require('../models/User');
const Channel = require('../models/Channel');
const Ad = require('../models/Ad');
const Transaction = require('../models/Transaction');

// Basic dashboard stats for an admin
const getAdminDashboardStats = async () => {
    try {
        const totalUsers = await User.countDocuments();
        const totalChannels = await Channel.countDocuments();
        const totalAds = await Ad.countDocuments();
        const totalTransactions = await Transaction.countDocuments();
        // More complex aggregations can be added here (e.g., total revenue)
        const totalRevenue = await Transaction.aggregate([
            { $match: { status: 'succeeded', type: 'ad_purchase' } }, // Assuming ad_purchase contributes to platformFee
            { $group: { _id: null, total: { $sum: '$platformFee' } } }
        ]);

        return {
            totalUsers,
            totalChannels,
            totalAds,
            totalTransactions,
            platformRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        };
    } catch (error) {
        console.error('Error in getAdminDashboardStats:', error);
        throw error;
    }
};

// Basic stats for a creator
const getCreatorDashboardStats = async (creatorId) => {
    try {
        const objectIdCreatorId = new mongoose.Types.ObjectId(creatorId);

        const channelsCount = await Channel.countDocuments({ userId: objectIdCreatorId });
        
        const creatorChannelIds = await Channel.find({ userId: objectIdCreatorId }).distinct('_id');
        const adsInUserChannels = await Ad.countDocuments({ channelId: { $in: creatorChannelIds }, status: 'published' });
        
        const creatorEarnings = await Transaction.aggregate([
            { 
                $match: { 
                    status: 'succeeded',
                    $or: [
                        // Earnings from ads sold on their channels
                        { relatedUser: objectIdCreatorId, type: 'ad_purchase' }, 
                        // Direct payouts to creator (if this is a separate transaction type for earnings)
                        // { userId: objectIdCreatorId, type: 'commission_payout' } // Example if such a type exists
                    ]
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    total: { 
                        $sum: '$netAmount' // Creator receives the netAmount from ad_purchase
                        // If including 'commission_payout', ensure the field to sum is correct (e.g., '$amount')
                        // $sum: {
                        //    $cond: [ { $eq: ["$type", "ad_purchase"] }, "$netAmount", "$amount" ] 
                        // }
                    } 
                } 
            }
        ]);

        return {
            channelsCount,
            activeAdsInChannels: adsInUserChannels,
            totalEarnings: creatorEarnings.length > 0 ? creatorEarnings[0].total : 0,
        };
    } catch (error) {
        console.error(`Error in getCreatorDashboardStats for ${creatorId}:`, error);
        throw error;
    }
};

// Placeholder for Advertiser Stats
const getAdvertiserDashboardStats = async (advertiserId) => {
    try {
        const objectIdAdvertiserId = new mongoose.Types.ObjectId(advertiserId);

        const adsCreated = await Ad.countDocuments({ advertiserId: objectIdAdvertiserId });
        const totalSpent = await Transaction.aggregate([
            { $match: { userId: objectIdAdvertiserId, type: 'ad_purchase', status: 'succeeded' } },
            { $group: { _id: null, total: { $sum: '$amount' } } } // Advertiser pays the gross amount
        ]);

        return {
            adsCreated,
            totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
        };
    } catch (error) {
        console.error(`Error in getAdvertiserDashboardStats for ${advertiserId}:`, error);
        throw error;
    }
};


module.exports = {
    getAdminDashboardStats,
    getCreatorDashboardStats,
    getAdvertiserDashboardStats // Added placeholder
};
