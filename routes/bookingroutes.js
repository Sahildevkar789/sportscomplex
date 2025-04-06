
const express = require('express');
const router = express.Router();
const Turf = require('../models/Turf');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Route to show booking page for a specific turf
router.get('/listings/:id', async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);
        const user = await User.findById(req.session.userId);  // Assuming the user is logged in
        res.render('user/booking', { turf, user });
    } catch (err) {
        res.status(500).send('Error loading booking page.');
    }
});
router.post('/booking/confirm', async (req, res) => {
  const { turfId, timeSlot, userId, date } = req.body;

  try {
    // Find turf and user
    const turf = await Turf.findById(turfId);
    const user = await User.findById(userId);
    if (!turf || !user) {
      return res.status(404).send('Turf or User not found.');
    }

    // Find the selected time slot
    const slot = turf.availableSlots.find(s => s.date === date && s.time === timeSlot);
    if (!slot || slot.isBooked) {
      return res.status(400).send('Slot unavailable.');
    }

    // Check if the user has enough balance to book
    const price = turf.pricePerHour;
    if (user.walletBalance < price) {
      return res.status(400).send('Insufficient wallet balance.');
    }

    // Deduct price from wallet and update booking history
    user.walletBalance -= price;
    user.bookingHistory.push({
      turfId,
      timeSlot,
      price,
      status: 'paid',
      bookingDate: new Date(),
    });

    // Mark the time slot as booked
    slot.isBooked = true;

    // Save changes
    await user.save();
    await turf.save();

    res.status(200).send('Booking confirmed and payment completed.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing booking.');
  }
});

// Route to view user's booking history
router.get('/:id/booking-history', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId).populate('bookingHistory.turfId');
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('booking-history', { bookings: user.bookingHistory });
    } catch (err) {
        res.status(500).send('Error fetching booking history.');
    }
});

// Route to view wallet balance
router.get('/wallet', async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);  // Assuming session contains userId
        res.render('wallet', { walletBalance: user.walletBalance });
    } catch (err) {
        res.status(500).send('Error loading wallet.');
    }
});

// Route to add funds to wallet
router.post('/wallet/add', async (req, res) => {
    const { amount } = req.body;

    try {
        const user = await User.findById(req.session.userId);  // Assuming session contains userId
        user.walletBalance += parseFloat(amount);

        user.transactionHistory.push({
            type: 'credit',
            amount: parseFloat(amount),
            description: 'Added funds to wallet',
        });

        await user.save();
        res.redirect('/wallet');
    } catch (err) {
        res.status(500).send('Error adding funds to wallet.');
    }
});

module.exports = router;
