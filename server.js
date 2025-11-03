require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth'); 
const itemsRoutes = require('./routes/items');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const imageRecognitionRoutes = require('./routes/imageRecognition');
const connectDB = require('./config/database'); // make sure the filename matches: db.js, not database.js

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}${req.body?.email ? ` - ${req.body.email}` : ''}`);
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});