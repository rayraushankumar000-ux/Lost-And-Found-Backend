

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Check critical environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('💡 Please check your .env file in lost-found-backend/ directory');
  if (missingEnvVars.includes('JWT_SECRET')) {
    console.error('   JWT_SECRET is required for authentication. Set it to a long random string.');
  }
  if (missingEnvVars.includes('MONGO_URI')) {
    console.error('   MONGO_URI is required. Example: mongodb://localhost:27017/lostfound');
  }
  process.exit(1);
}

console.log('✅ Environment variables check passed');

const authRoutes = require('./routes/auth'); 
const itemsRoutes = require('./routes/items');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const imageRecognitionRoutes = require('./routes/imageRecognition');
const connectDB = require('./config/database');

const app = express();

// CORS configuration


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, req.body?.email ? `- ${req.body.email}` : '');
  next();
});

// Base route
app.get('/', (req, res) => {
  res.send('Backend is working');
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/image-recognition', imageRecognitionRoutes);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 4000;

// Connect to database
connectDB();

// Start server after DB connection (handle both new connection and existing connection)
const startServer = () => {
  if (mongoose.connection.readyState === 1) {
    // Already connected
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
    });
  } else {
    // Wait for connection
    mongoose.connection.once('open', () => {
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌐 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API base: http://localhost:${PORT}/api`);
      });
    });
  }
};

// Check if already connected or wait for connection
startServer();

// Handle connection errors
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false,
      message: 'CORS: Origin not allowed. Check CLIENT_ORIGIN in server .env file.' 
    });
  }

  // Default error response
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Server error. Check server logs for details.' 
  });
});
