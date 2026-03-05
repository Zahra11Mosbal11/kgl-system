const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
  nationalId: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple nulls if not provided
    trim: true
  },
  totalDebt: {
    type: Number,
    default: 0
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga'],
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
