const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true
  },
  productsSupplied: [{
    type: String
  }],
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga', 'All'],
    required: true
  },
  lastDelivery: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
