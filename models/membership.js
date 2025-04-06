const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    sport: { type: String, required: true },
    monthSlot: { type: String, enum: ["1 month", "2 months", "3 months", "6 months", "12 months"], required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    bookingDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String, required: true },
    userDetails: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        age: { type: Number, required: true }
    },
    isActive: { type: Boolean, default: true }
});

const Membership = mongoose.model('Membership', MembershipSchema);
module.exports = Membership;
