const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/auth'); // JWT auth middleware

// Report lost item - authenticated
router.post('/report-lost', protect, upload.single('image'), itemController.createItem);

// Report found item - authenticated
router.post('/report-found', protect, upload.single('image'), itemController.createItem);

// Search items - public (supports ?q=...&near=lat,lng)
// Must come before /:id route to avoid conflict
router.get('/search', itemController.searchItems);

// Generic create item (for backward compatibility) - authenticated
router.post('/', protect, upload.single('image'), itemController.createItem);

// Alternative route for multiple images
router.post('/multi', protect, upload.array('images', 5), itemController.createItem);

// Get single item by ID - public (must be last to avoid conflict with /search)
router.get('/:id', itemController.getItemById);

module.exports = router;
