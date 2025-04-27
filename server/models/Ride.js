const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  blockchainRideId: {
    type: Number,
    required: true,
    unique: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  seats: {
    type: Number,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true
  },
  pricePerSeat: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paymentCompleted: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Ride', RideSchema);