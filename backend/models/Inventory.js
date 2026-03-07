const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  produceName: {
    type: String,
    required: true,
    trim: true
  },
  produceType: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  latestCost: {
    type: Number,
    default: 0
  },
  latestSellingPrice: {
    type: Number,
    default: 0
  },
    branch: {
    type: String,
    enum: ['Maganjo', 'Matugga', 'All'],
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure unique combination of produce and branch
inventorySchema.index({ produceName: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
