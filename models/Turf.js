const mongoose = require('mongoose');

// Define the Turf Schema
const TurfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  description: { type: String },
  availableSlots: [{  // Available time slots for booking
    dateSlot: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    isBooked: { type: Boolean, default: false }
  }]
});

// // Pre-save hook to set default time slots
// TurfSchema.pre('save', function(next) {
//   if (this.isNew) {  // Only for new documents
//     const slots = [];
//     const times = [
//       '9 AM - 10 AM',
//       '10 AM - 11 AM',
//       '11 AM - 12 PM',
//       '12 PM - 1 PM',
//       '1 PM - 2 PM',
//       '2 PM - 3 PM',
//       '3 PM - 4 PM',
//       '4 PM - 5 PM'
//     ];

//     const today = new Date();
//     for (let i = 0; i < 30; i++) {
//       const date = new Date(today);
//       date.setDate(today.getDate() + i);  // Increment date by i days

//       times.forEach((timeSlot) => {
//         slots.push({
//           dateSlot: date,
//           timeSlot,
//           isBooked: false,  // Set all slots as available initially
//         });
//       });
//     }

//     this.availableSlots = slots;  // Set the available slots
//   }

//   next();  // Move to the next operation (saving the document)
// });
TurfSchema.pre('save', function(next) {
  if (this.isNew) {  // Only for new documents
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
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setUTCHours(0, 0, 0, 0);  // Ensure dateSlot is always at midnight UTC

      times.forEach((timeSlot) => {
        slots.push({
          dateSlot: date,
          timeSlot,
          isBooked: false,
        });
      });
    }

    this.availableSlots = slots;  
  }

  next();
});

// Create the Turf model
const Turf = mongoose.model('Turf', TurfSchema);

module.exports = Turf;


