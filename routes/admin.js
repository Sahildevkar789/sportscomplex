const express = require('express');
const router = express.Router();
const Turf = require('../models/Turf.js'); // Turf model
const User = require('../models/User.js'); // User model
const { isAuthenticated, isAdmin } = require('../middleware/auth.js'); // Middleware
const Booking = require('../models/Booking.js');  
const Message = require('../models/mgs.js');  


router.get("/dashboard", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }); // Get latest messages
    res.render("admin/dashboard", { username: req.session.username, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send("Error fetching messages.");
  }
});
// View all turfs
router.get('/turfs', async (req, res) => {
  try {
    const turfs = await Turf.find({});
    res.render('admin/turfs.ejs', { turfs });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to fetch turfs');
    res.redirect('/admin/dashboard');
  }
});


// Create a new turf (GET: Render form)
router.get('/turfs/new' ,(req, res) => {
  res.render('admin/create-turf.ejs');
});

// Create a new turf (POST: Handle form submission)
router.post('/turfs', async (req, res) => {
  const { title, imageUrl, pricePerHour, description } = req.body;
  try {
    const newTurf = new Turf({ title, imageUrl, pricePerHour, description });
    await newTurf.save();
    req.flash('success', 'Turf created successfully');
    res.redirect('/admin/turfs');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to create turf');
    res.redirect('/admin/turfs/new');
  }
});

// Edit a turf (GET: Render edit form)
router.get('/turfs/:id/edit', async (req, res) => {
  const { id } = req.params;
  try {
    const turf = await Turf.findById(id);
    if (!turf) {
      req.flash('error', 'Turf not found');
      return res.redirect('/admin/turfs');
    }
    res.render('admin/edit-turf.ejs', { turf });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to fetch turf');
    res.redirect('/admin/turfs');
  }
});

// Edit a turf (POST: Handle form submission)
router.post('/turfs/:id', async (req, res) => {
  const { id } = req.params;
  const { title, imageUrl, pricePerHour, description } = req.body;
  try {
    const turf = await Turf.findById(id);
    if (!turf) {
      req.flash('error', 'Turf not found');
      return res.redirect('/admin/turfs');
    }
    turf.title = title;
    turf.imageUrl = imageUrl;
    turf.pricePerHour = pricePerHour;
    turf.description = description;
    await turf.save();
    req.flash('success', 'Turf updated successfully');
    res.redirect('/admin/turfs');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update turf');
    res.redirect(`/admin/turfs/${id}/edit`);
  }
});

// Delete a turf
router.get('/turfs/:id/delete', async (req, res) => {
  const { id } = req.params;
  try {
    await Turf.findByIdAndDelete(id);
    req.flash('success', 'Turf deleted successfully');
    res.redirect('/admin/turfs');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete turf');
    res.redirect('/admin/turfs');
  }
});
router.get('/bookings', async (req, res) => {
    try {
      // Fetch all users and populate the `turfId` field inside `bookingHistory`
      const users = await User.find().populate('bookingHistory.turfId');  // Populate turfId inside bookingHistory
      
      // Flatten all booking histories from each user into one array
      const allBookings = users.map(user => user.bookingHistory).flat();
  
      // Render the bookings page and pass the bookings data
      res.render('admin/booking.ejs', { bookings: allBookings });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Error fetching bookings');
      res.redirect('/admin/dashboard');
    }
  });
  router.get('/data', isAdmin, async (req, res) => {
    try {
      // Fetch all users with membership history
      const users = await User.find({ "membershipBookingHistory.0": { $exists: true } });

      let totalIncome = 0;
      const sportsData = {};

      // Process each user's membership bookings
      users.forEach(user => {
          user.membershipBookingHistory.forEach(membership => {
              totalIncome += membership.price; // Calculate total revenue

              if (!sportsData[membership.sport]) {
                  sportsData[membership.sport] = { 
                      name: membership.sport, 
                      bookings: [], 
                      totalIncome: 0, 
                      slotsUsed: 0 
                  };
              }
              sportsData[membership.sport].bookings.push(membership);
              sportsData[membership.sport].totalIncome += membership.price;
              sportsData[membership.sport].slotsUsed++;
          });
      });

      // Convert object to array & calculate remaining slots
      const sports = Object.values(sportsData).map(sport => ({
          ...sport,
          remainingSlots: Math.max(100 - sport.slotsUsed, 0) // Ensure it doesn't go below 0
      }));

      res.render('admin/memberdata.ejs', { sports, totalIncome });
  } catch (error) {
      console.error("Error fetching membership data:", error);
      req.flash('error_msg', 'Error loading membership bookings.');
      res.redirect('/admin');
  }

});
module.exports = router;


module.exports = router;

module.exports = router;
