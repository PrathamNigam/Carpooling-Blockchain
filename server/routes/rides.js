const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Ride = require('../models/Ride'); // Make sure the path is correct
const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth');

// Create a new ride (protected route)
router.post('/', auth, rideController.createRide);

// Get all rides
router.get('/', rideController.getRides);

router.delete('/:id', auth, rideController.cancelRide);

// Search for rides
router.get('/search', rideController.searchRides);

// Get ride by ID
router.get('/:id', rideController.getRideById);

// Cancel ride (protected route)
router.put('/:id/cancel', auth, rideController.cancelRide);

// Complete ride and release payment (protected route)
router.put('/:id/complete', auth, async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.id);
      
      if (!ride) {
        return res.status(404).json({ msg: 'Ride not found' });
      }
      
      // Check if user is the driver
      if (ride.driver.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
      
      // Check if departure time has passed
      if (new Date(ride.departureTime) > new Date()) {
        return res.status(400).json({ msg: 'Cannot complete ride before departure time' });
      }
      
      // Mark ride as inactive and store transaction hash
      ride.active = false;
      ride.transactionHash = req.body.transactionHash;
      ride.completedAt = Date.now();
      ride.paymentCompleted = true; // Add this flag
      
      await ride.save();
      
      res.json(ride);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

module.exports = router;