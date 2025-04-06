
const mongoose = require("mongoose");

const turfs = [
  {
    title: "Football Turf A",
    imageUrl: "https://example.com/football-turf-a.jpg",
    pricePerHour: 500,
    description: "High-quality football turf with artificial grass for professional matches.",
    // availableSlots will be auto-generated, so no need to add it
  },
  {
    title: "Cricket Ground B",
    imageUrl: "https://example.com/cricket-ground-b.jpg",
    pricePerHour: 700,
    description: "Spacious cricket ground with nets and professional pitch.",
  },
  // Add other turfs as needed
];

module.exports = { data: turfs };
