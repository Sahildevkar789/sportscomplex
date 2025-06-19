

const mongoose = require('mongoose');
const Turf = require('../models/Turf.js');  // Adjust path as needed

const MONGOURL = process.env.ATLASDB;  // MongoDB connection URL




const generateAvailableSlots = () => {
  const slots = [];
  const times = [
    '9 AM - 10 AM',
    '10 AM - 11 AM',
    '11 AM - 12 PM',
    '12 PM - 1 PM',
    '1 PM - 2 PM',
    '2 PM - 3 PM',
    '3 PM - 4 PM',
    '4 PM - 5 PM'
  ];

  const today = new Date();
  for (let i = 0; i < 1000; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);  // Increment date by i days
    date.setUTCHours(0, 0, 0, 0);  // Ensure dateSlot is always at midnight UTC

    times.forEach((timeSlot) => {
      slots.push({
        dateSlot: date,
        timeSlot,
        isBooked: false,  // Set all slots as available initially
      });
    });
  }
  return slots;
};

// Connect to MongoDB and insert turfs
async function main() {
  try {
    await mongoose.connect(MONGOURL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to DB");

    await initDB();

  } catch (err) {
    console.error("Error during connection or initialization:", err);
  } finally {
    mongoose.connection.close();  // Ensure the connection is closed after completion
    console.log("MongoDB connection closed");
  }
}

const initDB = async () => {
  try {
    // Delete any existing data in the Turf collection
    await Turf.deleteMany({});
    console.log("Existing data cleared");

    // Add owner field and generate available slots for each turf
    const turfsWithSlots = turfs.map(turf => ({
      ...turf,
      owner: "6796364bc88132b03bc85727",  // Example owner ID
      availableSlots: generateAvailableSlots(),  // Directly generate and assign availableSlots
    }));

    // Insert data into the Turf collection
    await Turf.insertMany(turfsWithSlots);
    console.log("Turfs were successfully inserted with available slots");

  } catch (err) {
    console.error("Error during insertion:", err);
  }
};

main();
