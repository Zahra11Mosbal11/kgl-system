const mongoose = require('mongoose');

const creditSaleSchema = new mongoose.Schema({
  buyerName: {
    type: String,
    required: true,
    minlength: 2
  },
  nationalId: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Uganda NIN : CM810123456789 (14 chars)
        return /^[A-Z]{2}[0-9A-Z]{12}$/.test(v);
      }
    }
  },
  location: {
    type: String,
    required: true,
    minlength: 2
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
  amountDue: {
    type: Number,
    required: true,
    min: 10000
  },
  salesAgentName: {
    type: String,
    required: true,
    minlength: 2
  },
  dueDate: {
    type: Date,
    required: true
  },
  produceName: {
    type: String,
    required: true,
    minlength: 2
  },
  produceType: {
    type: String,
    required: true,
    minlength: 2
  },
  tonnage: {
    type: Number,
    required: true
  },
  dispatchDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  branch: {
    type: String,
    enum: ['Maganjo', 'Matugga'],
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('CreditSale', creditSaleSchema);