const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validation');

// Error handler wrapper for async functions
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public routes
router.post('/signup', registerValidation, asyncHandler(register)); // Alias for /register
router.post('/register', registerValidation, asyncHandler(register)); // Keep for backward compatibility
router.post('/login', loginValidation, asyncHandler(login));

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route working!' });
});

module.exports = router;