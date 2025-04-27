const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  blockchainBookingId: {
    type: Number,
    required: true,
    unique: true
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seats: {
    type: Number,
    required: true
  },
  paid: {
    type: Boolean,
    default: false
  },
  transactionHash: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);