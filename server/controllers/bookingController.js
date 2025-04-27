const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const { getContract } = require('../config/blockchain');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { rideId, seats, blockchainBookingId, transactionHash } = req.body;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if enough seats available
    if (ride.availableSeats < seats) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    // Create booking in MongoDB
    const booking = new Booking({
      blockchainBookingId,
      ride: rideId,
      passenger: req.user.id,
      seats,
      paid: true,
      transactionHash
    });

    await booking.save();

    // Update available seats in ride
    ride.availableSeats -= seats;
    await ride.save();
    
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ passenger: req.user.id })
      .populate({
        path: 'ride',
        populate: {
          path: 'driver',
          select: 'username email walletAddress'
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is the passenger
    if (booking.passenger.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    // Get ride details
    const ride = await Ride.findById(booking.ride);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    // In a real app, you would call the blockchain to refund the payment
    
    // Update ride available seats
    ride.availableSeats += booking.seats;
    await ride.save();
    
    // Delete booking
    await Booking.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};