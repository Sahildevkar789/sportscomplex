const express = require('express');
const router = express.Router();
const User = require('../models/User');

// View wallet balance
router.get('/:id/wallet', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('wallet.ejs', { balance: user.walletBalance, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching wallet balance.');
  }
});

// Add funds to wallet
router.post('/:id/wallet/add', async (req, res) => {
  const userId = req.params.id;
  const { amount } = req.body;

  if (amount <= 0) {
    return res.status(400).send('Invalid amount.');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    user.walletBalance += parseFloat(amount); // Update wallet balance
    await user.save();

    res.send(`Funds added successfully. New Balance: ₹${user.walletBalance}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding funds to wallet.');
  }
});
