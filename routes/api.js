const express = require('express');
const Turf = require('../models/Turf');
const router = express.Router();

// API Route to get available slots for a specific turf and date
router.get('/api/turfs/:turfId/slots', async (req, res) => {
  const { turfId } = req.params;
  const { date } = req.query; // Get date from query parameters

  try {
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).send('Turf not found.');
    }

    // Filter slots based on the selected date and availability
    const availableSlots = turf.availableSlots.filter(
      (slot) => slot.date === date && !slot.isBooked
    );

    // Return available slots as JSON
    res.json(availableSlots);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching available slots.');
  }
});

module.exports = router;
