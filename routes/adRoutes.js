const express = require('express');
const router = express.Router();
const adService = require('../services/adService');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// @route   POST /api/ads
// @desc    Create a new ad
// @access  Private (Advertiser or Admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'advertiser' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only advertisers or admins can create ads.' });
    }
    const newAd = await adService.createAd(req.user.id, req.body);
    res.status(201).json(newAd);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/ads
// @desc    Get ads (can be filtered by advertiser, channel, status etc.)
// @access  Private (Context-dependent: all for admin, own for advertiser/creator)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let filter = {};
    // Example: if query param ?advertiserId=xyz is passed
    if (req.query.advertiserId) filter.advertiserId = req.query.advertiserId;
    if (req.query.channelId) filter.channelId = req.query.channelId;
    if (req.query.status) filter.status = req.query.status;

    // Security: Non-admins should only see relevant ads
    if (req.user.role === 'advertiser') {
      filter.advertiserId = req.user.id;
    } else if (req.user.role === 'creator') {
      // This is more complex: need to find ads for channels owned by the creator
      // This might be better as a separate endpoint or a more complex service layer query
      // For now, creators can't list ads directly this way unless they own the channel in the filter
    } else if (req.user.role !== 'admin' && !filter.advertiserId && !filter.channelId) {
        return res.status(403).json({message: "Forbidden: Please specify a filter or be an admin."})
    }

    const ads = await adService.getAds(filter);
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/ads/:id
// @desc    Get a specific ad by ID
// @access  Private (Owner - advertiser/creator of channel, or Admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ad = await adService.getAdById(req.params.id);
    // TODO: Add authorization check if user is advertiser, creator of channel, or admin
    res.json(ad);
  } catch (error) {
    if (error.message === 'Ad not found.') return res.status(404).json({ message: error.message});
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/ads/:id
// @desc    Update an ad
// @access  Private (Mainly Advertiser for drafts, or Admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Service layer should handle more granular permissions (e.g. advertiser can only edit drafts)
    const updatedAd = await adService.updateAd(req.params.id, req.user.id, req.user.role, req.body);
    res.json(updatedAd);
  } catch (error) {
    if (error.message === 'Ad not found.') return res.status(404).json({ message: error.message});
    if (error.message.includes('User not authorized')) return res.status(403).json({ message: error.message});
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/ads/:id/approve
// @desc    Approve an ad (by Channel Creator)
// @access  Private (Channel Creator)
router.post('/:id/approve', authenticateToken, async (req, res) => {
    if (req.user.role !== 'creator' && req.user.role !== 'admin' ) { // Admin might also approve
        return res.status(403).json({ message: 'Forbidden: Only channel creators or admins can approve ads.' });
    }
    try {
        const ad = await adService.approveAd(req.params.id, req.user.id);
        res.json({ message: 'Ad approved successfully', ad });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   POST /api/ads/:id/reject
// @desc    Reject an ad (by Channel Creator)
// @access  Private (Channel Creator)
router.post('/:id/reject', authenticateToken, async (req, res) => {
    if (req.user.role !== 'creator' && req.user.role !== 'admin' ) {
        return res.status(403).json({ message: 'Forbidden: Only channel creators or admins can reject ads.' });
    }
    try {
        const { reason } = req.body;
        const ad = await adService.rejectAd(req.params.id, req.user.id, reason);
        res.json({ message: 'Ad rejected successfully', ad });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   POST /api/ads/:id/request-modification
// @desc    Request modification for an ad (by Channel Creator)
// @access  Private (Channel Creator)
router.post('/:id/request-modification', authenticateToken, async (req, res) => {
    if (req.user.role !== 'creator' && req.user.role !== 'admin' ) {
        return res.status(403).json({ message: 'Forbidden: Only channel creators or admins can request ad modifications.' });
    }
    try {
        const { message } = req.body;
        if(!message) return res.status(400).json({message: "Modification message is required."})
        const ad = await adService.requestAdModification(req.params.id, req.user.id, message);
        res.json({ message: 'Ad modification requested successfully', ad });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// @route   DELETE /api/ads/:id
// @desc    Delete an ad
// @access  Private (Advertiser if draft, or Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Service layer handles permissions
    const result = await adService.deleteAd(req.params.id, req.user.id, req.user.role);
    res.json(result);
  } catch (error) {
    if (error.message === 'Ad not found.') return res.status(404).json({ message: error.message});
    if (error.message.includes('User not authorized')) return res.status(403).json({ message: error.message});
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
