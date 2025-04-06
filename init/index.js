

const mongoose = require('mongoose');
const Turf = require('../models/Turf');  // Adjust path as needed

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
  for (let i = 0; i < 90; i++) {
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


const turfs = [
  {
    title: "Football Turf A",
    imageUrl: "https://www.agnelhamara.net/uploads/images/articles/homepage/astroturf.jpg",
    pricePerHour: 500,
    description: "High-quality football turf with artificial grass for professional matches."
  },
  {
    title: "Football Turf B",
    imageUrl: "https://www.agnelhamara.net/uploads/images/articles/homepage/astroturf.jpg",
    pricePerHour: 550,
    description: "Premium football turf suitable for tournaments."
  },
  {
    title: "Badminton Court A",
    imageUrl: "https://www.agnelhamara.net/uploads/images/articles/homepage/astroturf.jpg",
    pricePerHour: 300,
    description: "Indoor badminton court with proper lighting and ventilation."
  },
  {
    title: "Badminton Court B",
    imageUrl: "https://www.agnelhamara.net/uploads/images/articles/homepage/astroturf.jpg",
    pricePerHour: 320,
    description: "Spacious badminton court for practice and matches."
  },
  {
    title: "Swimming Pool 1",
    imageUrl: "https://www.agnelhamara.net/uploads/images/articles/homepage/astroturf.jpg",
    pricePerHour: 400,
    description: "Olympic-size swimming pool with well-maintained facilities."
  },
  {
    title: "Basketball Court 1",
    imageUrl: "https://www.agnelhamara.net/uploads/images/articles/homepage/astroturf.jpg",
    pricePerHour: 350,
    description: "Outdoor basketball court with high-quality flooring."
  },
  {
    title: "Basketball Court 2",
    imageUrl: "https://www.agnelhamara.net/uploads/images/articles/homepage/astroturf.jpg",
    pricePerHour: 375,
    description: "Spacious basketball court for friendly matches and tournaments."
  },
  {
    title: "Table Tennis Room 1",
    imageUrl: "https://www.agnelhamara.net/uploads/images/articles/homepage/astroturf.jpg",
    pricePerHour: 250,
    description: "Dedicated indoor space for table tennis with high-quality tables."
  },
  {
    title: "Table Tennis Room 2",
    imageUrl: "https://www.agnelhamara.net/uploads/images/articles/homepage/astroturf.jpg",
    pricePerHour: 275,
    description: "Indoor table tennis room with advanced equipment."
  }
];

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
