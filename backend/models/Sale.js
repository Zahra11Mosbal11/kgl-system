const mongoose = require('mongoose');

const cashSaleSchema = new mongoose.Schema({
  produceName: {
    type: String,
    required: true
  },
  tonnage: {
    type: Number,
    required: true,
    min: 1
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 10000  // 5 numbers at least  
  },
  buyerName: {
    type: String,
    required: true,
    minlength: 2
  },
  contact: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 10
  },
  salesAgentName: {
    type: String,
    required: true,
    minlength: 2
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  time: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga', 'All'],
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CashSale', cashSaleSchema);