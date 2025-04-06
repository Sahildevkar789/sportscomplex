
// module.exports = router;
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming User model is located in '../models/User.js'
const bcrypt = require('bcryptjs');
const session = require('express-session');
const redirectIfAuthenticated = require('../middleware/redirectIfAuthenticated');
router.get('/signup', redirectIfAuthenticated, (req, res) => {
    res.render('users/signup'); // Render the signup page
  });
// Signup Route (User & Admin)
router.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if the email is already taken
    const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   req.flash('error', 'Email already in use');
    //   return res.redirect('/signup');
    // }
    // Hash the password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password,  // Save the hashed password
      role: role || 'user'  // Default role is 'user'
    });
console.log(newUser);
    // Save user to the database
    await newUser.save();
    req.flash('success', 'Registration successful');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/signup');
  }
});

// Login Page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('users/login.ejs');
});

// Login Handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // Login should be based on email

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Regenerate the session
    req.session.regenerate((err) => {
      if (err) {
        req.flash('error', 'Something went wrong');
        return res.redirect('/login');
      }

      // Set session data
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.user = { _id: user._id, username: user.username, role: user.role };

      req.flash('success', 'Login successful');
      // Redirect based on the user's role
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/book');
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/login');
  }
});
// Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/');
  });
});

module.exports = router;
