const mongoose = require('mongoose');

const produceSchema = new mongoose.Schema({
  produceName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  tonnage: {
    type: Number,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  dealerName: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Produce', produceSchema);
