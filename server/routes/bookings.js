const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

// Create a new booking (protected route)
router.post('/', auth, bookingController.createBooking);

// Get user bookings (protected route)
router.get('/user', auth, bookingController.getUserBookings);

// Cancel booking (protected route)
router.delete('/:id', auth, bookingController.cancelBooking);

module.exports = router;