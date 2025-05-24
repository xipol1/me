const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [function() { return !this.googleId && !this.facebookId; }, 'Password is required if not using social login'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Do not return password by default
  },
  role: {
    type: String,
    enum: ['creator', 'advertiser', 'admin'],
    default: 'creator'
  },
  avatar: {
    type: String, // URL to avatar image
    default: null
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  country: {
    type: String,
    trim: true,
    default: null
  },
  language: {
    type: String,
    default: 'en'
  },
  isVerified: { // Email verification status
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },
  // For social logins
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Payment related info (simplified, could be more complex)
  paymentMethods: [{
    type: { type: String, enum: ['stripe', 'paypal', 'crypto'] },
    identifier: String, // e.g., Stripe customer ID, PayPal email, crypto address
    isDefault: Boolean
  }],
  // Creator specific fields
  creatorProfile: {
    bio: String,
    specializations: [String],
    portfolioUrl: String,
    responseTimeUnit: { type: String, enum: ['hours', 'days'], default: 'hours'},
    responseTimeValue: { type: Number, default: 24 }
  },
  // Advertiser specific fields
  advertiserProfile: {
    companyName: String,
    industry: String,
    websiteUrl: String
  },
  // Wallet balance (simplified, might be a separate collection in a real app)
  // This is a basic representation, a full wallet system would be more complex
  wallet: {
    balances: [{
      currency: { type: String, required: true },
      amount: { type: Number, default: 0 }
    }],
    defaultCurrency: { type: String, default: 'USD' }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new) and not using social login
  if (!this.isModified('password') || this.googleId || this.facebookId || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false; // Should not happen if password is required
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
