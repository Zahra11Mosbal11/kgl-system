const mongoose = require('mongoose');

const creditSaleSchema = new mongoose.Schema({
  buyerName: {
    type: String,
    required: true
  },
  nin: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  amountDue: {
    type: Number,
    required: true
  },
  produceName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  salesAgentName: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  dispatchDate: {
    type: Date,
    default: Date.now
  },
  branch: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CreditSale', creditSaleSchema);
