const mongoose = require('mongoose');

// Schema for Booking model
const BookingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  turfId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Turf', 
    required: true 
  },
  dateSlot:{
    type:Date,
    required:true
  },
  timeSlot: { 
    type: String, 
    required: true 
  },
  paymentMode: { 
    type: String, 
    required: true, 
    enum: ['wallet', 'credit', 'debit', 'cash'],  // You can specify acceptable payment modes here
  },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'cancelled'], 
    default: 'pending'  // Adding status for each booking
  },
  price: { 
    type: Number, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date 
  },
});

// Update the updatedAt field whenever the document is modified
BookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
