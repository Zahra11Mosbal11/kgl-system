const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  produceName: {
    type: String,
    required: true,
    trim: true
  },
  produceType: {
    type: String,
    required: true,
    minlength: 2,
    validate: {
      validator: function(v) {
        return /^[A-Za-z]{2,}$/.test(v);
      }
    }
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
  tonnage: {
    type: Number,
    required: true,
    min: 100  // 3 numbers at least
  },
  cost: {
    type: Number,
    required: true,
    min: 10000  // 5   numbers at least
  },
  dealerName: {
    type: String,
    required: true,
    minlength: 2
  },
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga', 'All'],
    required: true
  },
  contact: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      }
    }
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Mobile Money', 'Bank Transfer', 'Credit'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial'],
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ""
  },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);