const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../config/email');

const generateToken = (id) => {
  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    console.log('📝 Registration attempt:', { email: email?.toLowerCase()?.trim(), hasName: !!name, hasPassword: !!password });

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide name, email, and password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user exists
    let userExists;
    try {
      userExists = await User.findOne({ email: email.toLowerCase().trim() });
    } catch (dbError) {
      console.error('❌ Database error checking user:', dbError);
      return res.status(500).json({ 
        success: false,
        message: 'Database error. Please try again.' 
      });
    }

    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Create user
    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: phone ? phone.trim() : undefined
      });
    } catch (createError) {
      console.error('❌ User creation error:', createError);
      
      // Handle MongoDB duplicate key error
      if (createError.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this email already exists' 
        });
      }
      
      // Handle validation errors
      if (createError.name === 'ValidationError') {
        return res.status(400).json({ 
          success: false,
          message: Object.values(createError.errors).map(e => e.message).join(', ')
        });
      }

      throw createError; // Re-throw to be caught by outer catch
    }

    if (!user) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to create user' 
      });
    }

    // Send welcome email (optional, won't fail registration)
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendWelcomeEmail(email, name);
        console.log('📧 Welcome email sent to:', email);
      }
    } catch (emailError) {
      // Email failure should not stop registration
      console.error('⚠️ Email sending failed (non-critical):', emailError.message);
    }

    // Generate token
    let token;
    try {
      token = generateToken(user._id);
    } catch (tokenError) {
      console.error('❌ Token generation error:', tokenError);
      
      // If token generation fails, we still want to return user (though this shouldn't happen)
      return res.status(500).json({ 
        success: false,
        message: tokenError.message || 'Failed to generate authentication token. Please check server configuration (JWT_SECRET).' 
      });
    }

    if (!token) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to generate authentication token' 
      });
    }

    console.log('✅ Registration successful for:', user.email);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        verified: user.verified,
        token: token
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Handle MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Generic error response
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error during registration. Please check server logs for details.' 
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    let token;
    try {
      token = generateToken(user._id);
    } catch (tokenError) {
      console.error('❌ Token generation error:', tokenError);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to generate authentication token. Please check server configuration.' 
      });
    }

    console.log('✅ Login successful for:', user.email);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        verified: user.verified,
        avatar: user.avatar,
        rewards: user.rewards,
        token: token
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error during login' 
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const user = await User.findById(req.user.id || req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};