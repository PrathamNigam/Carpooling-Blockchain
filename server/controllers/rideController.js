const Ride = require('../models/Ride');
const User = require('../models/User');
const { getContract } = require('../config/blockchain');

// Create a new ride
exports.createRide = async (req, res) => {
  try {
    const { origin, destination, departureTime, seats, pricePerSeat, blockchainRideId } = req.body;

    // Create ride in MongoDB
    const ride = new Ride({
      blockchainRideId,
      driver: req.user.id,
      origin,
      destination,
      departureTime,
      seats,
      availableSeats: seats,
      pricePerSeat,
      active: true
    });

    await ride.save();
    
    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all rides
exports.getRides = async (req, res) => {
  try {
    const rides = await Ride.find({ active: true })
      .populate('driver', 'username email walletAddress')
      .sort({ departureTime: 1 });
    
    res.status(200).json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search for rides
exports.searchRides = async (req, res) => {
  try {
    const { origin, destination, departureDate } = req.query;
    
    let query = { active: true };
    
    if (origin) query.origin = { $regex: origin, $options: 'i' };
    if (destination) query.destination = { $regex: destination, $options: 'i' };
    
    if (departureDate) {
      const startOfDay = new Date(departureDate);
      const endOfDay = new Date(departureDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.departureTime = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const rides = await Ride.find(query)
      .populate('driver', 'username email walletAddress')
      .sort({ departureTime: 1 });
    
    res.status(200).json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ride by ID
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'username email walletAddress');
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    // Check if user is the driver
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this ride' });
    }
    
    // Update ride status
    ride.active = false;
    await ride.save();
    
    // In a real app, you would also update the blockchain state here
    
    res.status(200).json({ message: 'Ride cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};