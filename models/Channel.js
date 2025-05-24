const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  type: { // e.g., 'post', 'story', 'pinned_message', 'shoutout'
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    trim: true
  },
  description: { // e.g., "Standard post in channel feed", "Story visible for 24h"
    type: String,
    trim: true
  },
  durationDays: { // Optional: For how many days a post might be pinned, or a service lasts
    type: Number,
    min: 0
  }
}, { _id: false, timestamps: true }); // _id: false if embedded, timestamps for individual rates

const channelSchema = new mongoose.Schema({
  userId: { // The creator who owns this channel
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Channel name is required'],
    trim: true
  },
  platform: {
    type: String,
    enum: ['telegram', 'whatsapp', 'instagram', 'facebook', 'discord', 'tiktok', 'linkedin', 'other'],
    required: [true, 'Platform is required']
  },
  handle: { // e.g., @channelname, WhatsApp number, Instagram username
    type: String,
    required: [true, 'Channel handle or identifier is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: [{ // Can have multiple categories
    type: String,
    trim: true
  }],
  subscribers: {
    type: Number,
    default: 0,
    min: 0
  },
  audienceDemographics: { // Optional, more detailed audience info
    ageRange: String, // e.g., "18-24", "25-34"
    genderRatio: String, // e.g., "60% Female, 40% Male"
    primaryLocation: String, // e.g., "USA", "Brazil"
    interests: [String]
  },
  isVerified: { // Verified by platform admin
    type: Boolean,
    default: false
  },
  verificationDetails: { // Details about verification (e.g., method, date)
    method: String,
    verifiedAt: Date,
    notes: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_verification', 'rejected', 'suspended'],
    default: 'pending_verification'
  },
  policies: { // Creator's policies for this channel
    contentTypeAccepted: [String], // e.g., "Tech products", "Educational content"
    contentRestrictions: String, // e.g., "No gambling, no adult content"
    preferredPostTimes: String // e.g., "Weekdays 9am-5pm UTC"
  },
  rates: [rateSchema], // Embedded array of rate structures
  averageEngagementRate: { // Optional: Could be calculated or manually entered
    type: Number,
    min: 0
  },
  platformSpecificData: { // For any data unique to a platform
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for faster queries on common fields
channelSchema.index({ userId: 1 });
channelSchema.index({ platform: 1 });
channelSchema.index({ category: 1 });
channelSchema.index({ handle: 1, platform: 1 }, { unique: true, sparse: true });
channelSchema.index({ status: 1 });
channelSchema.index({ isVerified: 1 });


const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
