const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User.js");
const nodemailer = require("nodemailer");
const router = express.Router();

// 🏦 Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
// Function to send an email
require("dotenv").config();



// ✅ GET /wallet → Show wallet page
router.get("/", async (req, res) => {
    try {
        const userId = req.session.userId; // Assuming user is logged in
        if (!userId) return res.redirect("/login");

        const user = await User.findById(userId);
        if (!user) return res.status(404).send("User not found");

        res.render("user/wallet.ejs", { userId: user._id, balance: user.walletBalance, transactions: user.transactionHistory });
    } catch (error) {
        console.error("❌ Error fetching wallet:", error);
        res.status(500).send("Server error");
    }
});

// ✅ POST /wallet/order → Create Razorpay order
router.post("/order", async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const order = await razorpay.orders.create({
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: "wallet_txn_" + Date.now(),
        });

        res.json(order);
    } catch (error) {
        console.error("❌ Error creating order:", error);
        res.status(500).send("Error creating order");
    }
});

// ✅ POST /wallet/verify → Verify payment & update wallet balance
router.post("/verify", async (req, res) => {
    try {
        console.log("🔵 Payment verification request:", req.body);

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

        if (!userId || !amount) {
            console.log("❌ Missing userId or amount in request.");
            return res.status(400).json({ success: false, message: "Invalid request data" });
        }

        console.log("🔍 Verifying payment for UserID:", userId, "Amount:", amount);

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        console.log("🔑 Generated Signature:", generatedSignature);
        console.log("📌 Received Signature:", razorpay_signature);

        if (generatedSignature !== razorpay_signature) {
            console.log("❌ Invalid payment signature!");
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }

        console.log("✅ Payment verified successfully!");

        // 🔍 Find user
        const user = await User.findById(userId);
        if (!user) {
            console.log("❌ User not found!");
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log("🔄 Previous Wallet Balance:", user.walletBalance);
        
        // ✅ Update wallet balance and add transaction history
        await User.updateOne(
            { _id: userId },
            {
                $inc: { walletBalance: parseFloat(amount) },
                $push: {
                    transactionHistory: {
                        type: "credit",
                        amount: parseFloat(amount),
                        description: "Added funds via Razorpay",
                        date: new Date()
                    }
                }
            }
        );

        // Fetch updated user data
        const updatedUser = await User.findById(userId);
        console.log("✅ Updated Wallet Balance:", updatedUser.walletBalance);
       
        res.json({ success: true, message: "Wallet updated!", newBalance: updatedUser.walletBalance });
    } catch (error) {
        console.error("❌ Error in payment verification:", error);
        res.status(500).json({ success: false, message: "Payment verification Success" });
    }
});

// ✅ POST /wallet/add-funds → Add funds manually (for testing)
router.post("/add-funds", async (req, res) => {
    const { amount } = req.body;
    const userId = req.session.userId; // Get the logged-in user's ID

    console.log("💰 Received request to add funds. Amount:", amount, "UserID:", userId);

    try {
        if (!userId) {
            console.log("❌ User not logged in.");
            return res.status(401).send('User not logged in.');
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log("❌ User not found in database.");
            return res.status(404).send('User not found.');
        }

        console.log("🔍 User before update:", user);

        // Ensure amount is a valid number
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            console.log("❌ Invalid amount:", amount);
            return res.status(400).send('Invalid amount.');
        }

        // ✅ Update wallet balance safely and add transaction history
        await User.updateOne(
            { _id: userId },
            {
                $inc: { walletBalance: parsedAmount },
                $push: {
                    transactionHistory: {
                        type: "credit",
                        amount: parsedAmount,
                        description: "Added funds to wallet",
                        date: new Date()
                    }
                }
            }
        );

        // Fetch updated user data
        const updatedUser = await User.findById(userId);
        console.log("✅ Updated Wallet Balance:", updatedUser.walletBalance);

        res.redirect('/wallet');
    } catch (err) {
        console.error("❌ Error adding funds:", err);
        res.status(500).send('Error adding funds to wallet.');
    }
});

module.exports = router;
