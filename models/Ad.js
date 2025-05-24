const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  title: { // Optional, but good for management
    type: String,
    trim: true
  },
  content: { // The actual ad content
    text: String,
    imageUrl: String, // URL to image
    videoUrl: String, // URL to video
    linkUrl: String,  // Call to action link
    // Could be more structured based on ad type or platform
  },
  adType: { // Matches one of the rate types defined in the Channel model
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: [
      'draft',              // Advertiser is creating it
      'pending_approval',   // Submitted to creator for approval
      'requires_modification',// Creator requested changes
      'approved',           // Creator approved, pending payment or scheduling
      'scheduled',          // Payment confirmed, scheduled for publication
      'published',          // Ad is live
      'completed',          // Campaign duration finished
      'rejected',           // Creator rejected
      'cancelled_by_advertiser',
      'cancelled_by_creator',
      'error_publishing'    // System error during publication
    ],
    default: 'draft',
    required: true
  },
  price: { // Agreed price for this ad
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  scheduledDate: { // When the ad is intended to be published
    type: Date
  },
  publicationDate: { // Actual date of publication
    type: Date
  },
  publicationLink: { // Link to the live ad, if applicable
    type: String
  },
  durationDays: { // For how many days the ad should run (e.g., pinned posts)
    type: Number,
    min: 0
  },
  rejectionReason: String, // If status is 'rejected'
  modificationRequests: [{ // History of modification requests
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    requestedAt: { type: Date, default: Date.now }
  }],
  // Basic performance metrics (can be expanded or moved to a separate Stats model later)
  performance: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    // other relevant metrics
  }
}, {
  timestamps: true
});

// Indexes
adSchema.index({ advertiserId: 1 });
adSchema.index({ channelId: 1 });
adSchema.index({ status: 1 });
adSchema.index({ adType: 1 });
adSchema.index({ scheduledDate: 1 });

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
