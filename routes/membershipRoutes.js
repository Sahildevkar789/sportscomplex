const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User.js'); // User Model
const Membership = require('../models/membership.js'); // Membership Model
const router = express.Router();

// Membership pricing based on duration
const membershipPrices = {
  "1 month": 1000,
  "2 months": 1800,
  "3 months": 2500,
  "6 months": 5000,
  "12 months": 10000
};

// Available sports with a max limit of 100 members per month
const sportsList = ["Gym", "Badminton", "Tennis", "Swimming", "Basketball", "Football"];

// Book Membership Route
router.post('/book-membership', async (req, res) => {
  try {
    const { userId, sport, monthSlot, userPhone, userEmail, fullName, address, age } = req.body;

    // Validate inputs
    if (!sportsList.includes(sport)) {
      return res.status(400).json({ message: "Invalid sport selection" });
    }
    if (!membershipPrices[monthSlot]) {
      return res.status(400).json({ message: "Invalid membership duration" });
    }

    // Get the price based on monthSlot
    const price = membershipPrices[monthSlot];

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if wallet balance is sufficient
    if (user.walletBalance < price) {
      return res.status(400).json({ message: "Insufficient balance in wallet" });
    }

    // Check if slots are available for the selected sport and month
    const activeMemberships = await Membership.countDocuments({ sport, monthSlot, isActive: true });

    if (activeMemberships >= 100) {
      return res.status(400).json({ message: "No slots available for this sport in the selected month" });
    }

    // Deduct amount from wallet
    user.walletBalance -= price;

    // Create membership booking
    const membership = new Membership({
      userId,
      username: user.username,
      sport,
      monthSlot,
      price,
      status: "paid",
      bookingDate: new Date(),
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + parseInt(monthSlot))),
      userPhone,
      userEmail,
      userDetails: { fullName, address, age },
      isActive: true
    });
    user.membershipBookingHistory.push(membership);
    user.transactionHistory.push({
        type: "debit",
        amount: price,
        date: new Date(),
        description: `Membership booking for ${sport} (${monthSlot})`
      });
    // Save user and membership
    await user.save();
    await membership.save();

    return res.status(201).json({ message: "Membership booked successfully!", membership });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API to Check Available Slots for a Sport
router.get('/available-slots/:sport/:monthSlot', async (req, res) => {
  try {
    const { sport, monthSlot } = req.params;
    
    // Validate sport and monthSlot
    if (!sportsList.includes(sport)) {
      return res.status(400).json({ message: "Invalid sport selection" });
    }
    if (!membershipPrices[monthSlot]) {
      return res.status(400).json({ message: "Invalid membership duration" });
    }

    // Get the count of active bookings for the selected sport and month
    const activeMemberships = await Membership.countDocuments({ sport, monthSlot, isActive: true });

    return res.status(200).json({ availableSlots: 100 - activeMemberships });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API to Auto-Expire Memberships (Run this daily using a cron job)
router.post('/expire-memberships', async (req, res) => {
  try {
    const expiredMemberships = await Membership.updateMany(
      { expiryDate: { $lt: new Date() }, isActive: true },
      { $set: { isActive: false } }
    );

    return res.status(200).json({ message: "Expired memberships updated!", expiredCount: expiredMemberships.modifiedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get('/history',  async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('membershipBookingHistory');
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/login');
        }

        res.render('user/membership-history.ejs', { title: "Membership History", user });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error fetching membership history.');
        res.redirect('/');
    }
});
module.exports = router;
