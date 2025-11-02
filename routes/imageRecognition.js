const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const imageRecognitionController = require('../controllers/imageRecognitionController');
const { protect } = require('../middleware/auth');

// POST /api/image-recognition - accepts image and returns predicted labels
// Auth is optional - can be public or protected depending on usage
router.post('/', upload.single('image'), imageRecognitionController.recognizeImage);

module.exports = router;

