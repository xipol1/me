const express = require('express');
const router = express.Router();
const channelService = require('../services/channelService');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// @route   POST /api/channels
// @desc    Create a new channel
// @access  Private (Creator or Admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Ensure only creators or admins can create channels
    if (req.user.role !== 'creator' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only creators or admins can create channels.' });
    }
    const newChannel = await channelService.createChannel(req.user.id, req.body);
    res.status(201).json(newChannel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/channels
// @desc    Get all channels (publicly viewable, or filtered for marketplace)
// @access  Public (can be adjusted with filters)
router.get('/', async (req, res) => {
  try {
    // TODO: Implement proper filtering, pagination, searching for marketplace
    const channels = await channelService.getAllChannels({ status: 'active', isVerified: true }); // Example filter
    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/channels/my-channels
// @desc    Get channels for the currently authenticated user
// @access  Private (Creator)
router.get('/my-channels', authenticateToken, async (req, res) => {
    if (req.user.role !== 'creator' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only creators or admins can view their channels.' });
    }
    try {
        const channels = await channelService.getChannelsByUserId(req.user.id);
        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @route   GET /api/channels/:id
// @desc    Get a specific channel by ID
// @access  Public (details might be limited for non-owners/non-admins)
router.get('/:id', async (req, res) => {
  try {
    const channel = await channelService.getChannelById(req.params.id);
    res.json(channel);
  } catch (error) {
    if (error.message === 'Channel not found.') return res.status(404).json({ message: error.message});
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/channels/:id
// @desc    Update a channel
// @access  Private (Owner or Admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Authorization is handled within the service layer for ownership
    const updatedChannel = await channelService.updateChannel(req.params.id, req.user.id, req.body);
    res.json(updatedChannel);
  } catch (error) {
    if (error.message === 'Channel not found.') return res.status(404).json({ message: error.message});
    if (error.message.includes('User not authorized')) return res.status(403).json({ message: error.message});
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/channels/:id
// @desc    Delete a channel
// @access  Private (Owner or Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Authorization is handled within the service layer
    const result = await channelService.deleteChannel(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Channel not found.') return res.status(404).json({ message: error.message});
    if (error.message.includes('User not authorized')) return res.status(403).json({ message: error.message});
    res.status(500).json({ message: error.message });
  }
});

// --- Channel Rates ---
// @route POST /api/channels/:channelId/rates
// @desc Add a rate to a channel
// @access Private (Owner)
router.post('/:channelId/rates', authenticateToken, async (req, res) => {
    try {
        const channel = await channelService.addRateToChannel(req.params.channelId, req.user.id, req.body);
        res.status(201).json(channel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route PUT /api/channels/:channelId/rates/:rateId
// @desc Update a specific rate in a channel
// @access Private (Owner)
router.put('/:channelId/rates/:rateId', authenticateToken, async (req, res) => {
    try {
        const channel = await channelService.updateRateInChannel(req.params.channelId, req.user.id, req.params.rateId, req.body);
        res.json(channel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route DELETE /api/channels/:channelId/rates/:rateId
// @desc Delete a specific rate from a channel
// @access Private (Owner)
router.delete('/:channelId/rates/:rateId', authenticateToken, async (req, res) => {
    try {
        const channel = await channelService.deleteRateFromChannel(req.params.channelId, req.user.id, req.params.rateId);
        res.json(channel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// @route   PUT /api/channels/:id/verify
// @desc    Verify a channel (Admin only)
// @access  Private (Admin)
router.put('/:id/verify', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const channel = await channelService.verifyChannel(req.params.id /*, req.user.id */);
    res.json({ message: 'Channel verified successfully', channel });
  } catch (error) {
    if (error.message === 'Channel not found.') return res.status(404).json({ message: error.message});
    res.status(400).json({ message: error.message });
  }
});


module.exports = router;
