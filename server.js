require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth'); 
const itemsRoutes = require('./routes/items');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const imageRecognitionRoutes = require('./routes/imageRecognition');
const dashboardRoutes = require('./routes/dashboard'); // ✅ added

const connectDB = require('./config/database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// ✅ Serve static files (favicon, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Debug logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Base route
app.get('/', (req, res) => {
  res.send('Backend is working');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/image-recognition', imageRecognitionRoutes);
app.use('/api/dashboard', dashboardRoutes); // ✅ added dashboard routes

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
