const cron = require("node-cron");
const Turf = require("../models/Turf");

// Schedule the job to reset slots every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Adding new slots for the next day...");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const newDate = tomorrow.toISOString().split("T")[0];

  const times = [
    "9 AM - 10 AM",
    "10 AM - 11 AM",
    "11 AM - 12 PM",
    "12 PM - 1 PM",
    "1 PM - 2 PM",
    "2 PM - 3 PM",
    "3 PM - 4 PM",
    "4 PM - 5 PM",
  ];

  const newSlots = times.map((time) => ({
    date: newDate,
    time,
    isBooked: false,
  }));

  try {
    await Turf.updateMany({}, { $push: { availableSlots: { $each: newSlots } } });
    console.log("New slots added successfully for all turfs.");
  } catch (err) {
    console.error("Error adding new slots:", err);
  }
});

module.exports = cron;
