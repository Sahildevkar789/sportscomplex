// backend/routes/turfRoutes.js
const express = require("express");
const { createTurf } = require("../controllers/turfController");
const router = express.Router();

// Create a new turf
router.post("/create", createTurf);

module.exports = router;
