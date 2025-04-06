const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // For password hashing
const saltRounds = 10;

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v); // Email validation
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: { type: String, required: true, minlength: [6, 'Password must be at least 6 characters long'] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  walletBalance: { type: Number, default: 0 }, // Wallet for payments
  bookingHistory: [{
    username: { type: String, required: true },// Add userId reference
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Add userId referenc
    turfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
    timeSlot: { type: String, required: true },
    dateSlot: { type: Date, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    bookingDate: { type: Date, default: Date.now }
  }],
  // Membership Booking History
  membershipBookingHistory: [{
    username: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sport: { type: String, enum: ['Gym', 'Badminton', 'Tennis', 'Swimming', 'Basketball', 'Football'], required: true },
    monthSlot: { type: String, enum: ['1 month', '2 months', '3 months', '6 months', '12 months'], required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    bookingDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },  // Membership expiry date
    paymentMode: { type: String, enum: ['wallet', 'credit_card'], default: 'wallet' }, // Payment type
    userPhone: { type: String, required: true },
    userEmail: { type: String, required: true },
    userDetails: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      age: { type: Number, required: true },
    },
  }],
  transactionHistory: [{
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String }
  }],
  isActive: { type: Boolean, default: true }
});

// Virtual for booking count
UserSchema.virtual('bookingCount').get(function() {
  return this.bookingHistory.length;
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});
UserSchema.pre('save', function (next) {
  this.membershipBookingHistory.forEach(membership => {
    if (!membership.expiryDate) {
      const months = parseInt(membership.monthSlot.split(" ")[0]); // Extract numeric value from monthSlot
      membership.expiryDate = new Date();
      membership.expiryDate.setMonth(membership.expiryDate.getMonth() + months);
    }
  });
  next();
});
// Password comparison method
UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// UserSchema.index({ email: 1 });
// UserSchema.index({ role: 1 });

const User = mongoose.model('User', UserSchema);
module.exports = User;
