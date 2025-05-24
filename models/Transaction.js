const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { // e.g., 'payment', 'withdrawal', 'refund', 'commission_payout', 'platform_fee'
    type: String,
    enum: ['payment', 'withdrawal', 'refund', 'commission_payout', 'platform_fee', 'ad_purchase'],
    required: true
  },
  userId: { // User initiating or receiving the transaction (can be advertiser or creator)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedUser: { // Counterparty if applicable (e.g., creator for ad_purchase, platform for fee)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad'
    // Not always required, e.g., for direct wallet top-ups or some platform fees
  },
  channelId: { // Useful for tracking revenue per channel
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  description: { // e.g., "Payment for Ad #123", "Withdrawal to PayPal"
    type: String,
    trim: true
  },
  amount: { // Gross amount of the transaction
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  platformFee: { // Fee taken by the platform
    type: Number,
    default: 0
  },
  processorFee: { // Fee taken by payment processor (Stripe, PayPal)
    type: Number,
    default: 0
  },
  netAmount: { // Amount credited/debited after fees (amount - platformFee - processorFee)
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'requires_action'],
    required: true,
    default: 'pending'
  },
  paymentMethod: { // e.g., 'stripe', 'paypal', 'crypto', 'wallet_balance'
    type: String
  },
  paymentGatewayId: { // ID from Stripe, PayPal, or crypto transaction hash
    type: String,
    index: true, // Good for searching transactions by gateway ID
    sparse: true
  },
  gatewayResponse: { // Store raw response from gateway for debugging, if necessary
    type: mongoose.Schema.Types.Mixed
  },
  metadata: { // Any other relevant data
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, type: 1, status: 1 });
transactionSchema.index({ adId: 1 });
transactionSchema.index({ channelId: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
