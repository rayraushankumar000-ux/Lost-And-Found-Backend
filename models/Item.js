// models/Item.js (simplified)
const mongoose = require('mongoose');
const itemSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  location: { address: String, city: String, coords: { lat: Number, lng: Number } },
  status: { type: String, enum: ['lost','found'], default: 'lost' },
  images: [{ url: String, public_id: String }],
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

itemSchema.index({ title: 'text', description: 'text' }); // text index
module.exports = mongoose.model('Item', itemSchema);
