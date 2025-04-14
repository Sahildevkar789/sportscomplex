require('dotenv').config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Turf = require("./models/Turf.js");
const path = require("path");
const ejsmate = require("ejs-mate");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const User = require('./models/User.js');
const { isLoggedIn } = require('./middleware/auth.js');
const adminRoutes = require('./routes/admin.js');
const bookingroutes = require('./routes/bookingroutes.js');
const userRoutes = require('./routes/userRoutes.js');
const { body, validationResult } = require('express-validator');
const Booking = require('./models/Booking.js');
const fs = require('fs');
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const MONGOURL = process.env.ATLASDB;
const Message = require('./models/mgs.js');
const receiptRoutes = require('./routes/receipt.js');

main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGOURL);
}

// Set up the views and EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For parsing JSON data
app.engine("ejs",ejsmate);
app.use(express.static(path.join(__dirname, 'public'))); // For serving static files (CSS, JS, images)

const store = MongoStore.create({
    mongoUrl: MONGOURL,
    crypto: {
      secret: 'secret-key', // Change this to a secure key in production
      },
      touchAfter: 24 * 60 * 60, // 1 day in seconds
      });

// Session and flash message middleware
app.use(session({
  store,
    secret: 'secret-key',  // Change to a secure key in production
    resave: false,
    saveUninitialized: true,
    cookie: {  httpOnly: true,secure: false ,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: 'lax',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24) // Set cookie expiration to 1 day
    } 
}));
app.use(flash());  // Initialize flash messages
// Middleware to make session data available to views
app.use((req, res, next) => {
  res.locals.session = req.session;
    // Make session data available in views
  next();
});


// used to pop alert mgs flash
app.use((req,res,next) => {
  res.locals.CurrUser =req.user;
 
  next();
});

// Middleware to make flash messages available to all views
app.use((req, res, next) => {
  res.locals.session = req.session;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.CurrUser =req.user;
    
    next();
});

// Routes
  // Load environment variables
const walletRoutes = require('./routes/walletroutes.js');
app.use('/wallet', walletRoutes);
// Home Route
app.get("/", (req, res) => {
    res.render("listings/home.ejs");
});

app.use((req, res, next) => {
  
  res.locals.isadminn = req.session.user && req.session.user.role === "admin";
  next();
});


app.get('/book',isLoggedIn, async (req, res) => {

    try {
        const allTurf = await Turf.find({});
    
        res.render("listings/index.ejs", { allTurf,username: req.session.username,admin:req.session.role });
 
      } catch (err) {
        res.status(500).send('Error loading turfs.');
    }
});
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      throw new Error("All fields are required.");
    }
    
    await new Message({ name, email, message }).save();
    res.redirect("/");
  } catch (error) {
    console.error("Error submitting message:", error.message);
    res.status(500).send("Error submitting message: " + error.message);
  }
});

const updateBookings = async () => {
    const users = await User.find(); // Fetch all users
    for (const user of users) {
      let updated = false;
      for (const booking of user.bookingHistory) {
        if (!booking.username) {
          // Add the username if it's missing
          booking.username = user.username;
          updated = true;
        }
      }
      if (updated) {
        await user.save(); // Save only if updates were made
        console.log(`Updated bookings for user: ${user.username}`);
      }
    }
  };
  
  updateBookings()
    .then(() => console.log('Finished updating bookingHistory.'))
    .catch((err) => console.error(err));
  
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg'); // Pass success message to the view
    res.locals.error_msg = req.flash('error_msg'); // Pass error message to the view
    next();
  });
 
  const membershipRoutes = require('./routes/membershipRoutes.js');

  app.use(express.urlencoded({ extended: true }));
  app.use('/api/membership', membershipRoutes);
  app.set('view engine', 'ejs');
  
  app.get('/membership', async (req, res) => {
    try {
        if (!req.session.userId) {
            req.flash('error_msg', 'You need to log in first.');
            return res.redirect('/login'); // Redirect to login if user is not logged in
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/login');
        }

        res.render('listings/membership.ejs', { title: "Membership Booking", user }); // ✅ Pass user to EJS
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error loading membership page.');
        res.redirect('/');
    }
});

app.get('/listings/:turfId', isLoggedIn, async (req, res) => {
  const turfId = req.params.turfId;

  try {
    // Find the turf by its ID
    const turf = await Turf.findById(turfId);

    // Get the logged-in user if available
    const user = req.session.userId ? await User.findById(req.session.userId) : null;

    // If the turf doesn't exist, return 404
    if (!turf) {
      return res.status(404).send('Turf not found');
    }

    // If availableSlots are empty, show a message or handle accordingly
    if (!turf.availableSlots || turf.availableSlots.length === 0) {
      console.log("No available slots for this turf.");
      return res.render('user/booking.ejs', { turf, user, errorMessage: 'No available slots for this turf at the moment.' });
    }

    // Render the booking page, passing the user and turf data
    res.render('user/booking.ejs', { turf, user });

    // Log the username if the user is logged in
    if (user) {
      console.log(user.username);
    }
  } catch (err) {
    // Log error and send a response
    console.error('Error fetching turf details:', err);
    res.status(500).send('Error fetching turf details');
  }
});

app.post('/booking/confirm', 
  [
    body('turfId').notEmpty().withMessage('Turf ID is required'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('date').notEmpty().withMessage('Date is required'),  // Ensure date is passed
  ],
  async (req, res) => {
    // Log the request body for debugging
    console.log('Request body111:', req.body);

    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { turfId, timeSlot, userId, date } = req.body;

    try {
      // Find turf by ID
      const turf = await Turf.findById(turfId);
      if (!turf) {
        req.flash('error_msg', 'Turf not found.');
        return res.redirect('/book');
      }


      // Find the requested time slot
      const slot = turf.availableSlots.find(
        s => s.dateSlot.toISOString().split('T')[0] === date && s.timeSlot === timeSlot
      );
      if (!slot) {
        req.flash('error_msg', 'Invalid time slot or date.');
        return res.redirect('/book');
      }

      if (slot.isBooked) {
        req.flash('error_msg', 'This slot is already booked.');
        return res.redirect('/book');
      }

      // Find user by ID
      const user = await User.findById(userId);
      if (!user) {
        req.flash('error_msg', 'User not found.');
        return res.redirect('/login');
      }

      // Calculate price and check user's wallet balance
      const price = turf.pricePerHour;
      if (user.walletBalance < price) {
        req.flash('error_msg', 'Insufficient wallet balance.');
        return res.redirect('/wallet');
      }

      // Deduct price from user's wallet
      user.walletBalance -= price;

      // Add booking to user's booking history
      const bookingDetails = {
        username: user.username,
        userId: user._id,  // Add userId reference to the booking history
        turfId,
        timeSlot,
        dateSlot: slot.dateSlot,  // Use dateSlot from the available slot
        price,
        status: 'paid',
        bookingDate: new Date(),
      };

      user.bookingHistory.push(bookingDetails);

      // Mark the slot as booked
      slot.isBooked = true;

      // Save updates to user and turf
      await user.save();
      await turf.save();
      console.log(bookingDetails);
     
      req.flash('success_msg', 'Booking confirmed and payment completed.');
     res.redirect('/done');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while processing the booking.');
      res.redirect('/book');
    }
  }
);


app.get('/done', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId); // Get the logged-in user
    if (!user) {
      return res.redirect('/login'); // Redirect if no user found
    }

    const latestBooking = user.bookingHistory[user.bookingHistory.length - 1]; // Get the last booking made
const title = await Turf.findById(latestBooking.turfId); // Get the turf details using turfId
  

// Render the 'done' view to show the receipt
    res.render('user/done.ejs', { booking: latestBooking , title: title.title }); // Pass the booking and turf title to the view
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching booking details');
  }
});

app.get('/booking-history', isLoggedIn, async (req, res) => {
    try {
      const userId = req.session.userId; // Getting the userId from the session
      const user = await User.findById(userId).populate('bookingHistory.turfId'); // Populate turfId with turf details
  
      if (!user) {
        return res.status(404).send('User not found.');
      }
  
      // Render the booking history page and pass the user's booking history
      res.render('user/booking-history.ejs', { bookings: user.bookingHistory });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching booking history.');
    }
  });

  const receiptsDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir);  // Create the directory if it doesn't exist
}

app.use('/receipt', receiptRoutes); // Use receiptRoutes for all routes starting with /receipt
// 📌 Route to Show Membership History
app.get('/history', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('membershipBookingHistory');
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/login');
        }

        res.render('listings/membership-history.ejs', { title: "Membership History", user });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error fetching membership history.');
        res.redirect('/');
    }
});
app.get("/360img",async(req,res) => {
  res.render("listings/360.ejs", { title: "360 Degree View" });
})
  
app.use('/booking', bookingroutes); // Use bookingRoutes for all routes starting with /booking

// User Routes
app.use('/', userRoutes); // Use userRoutes for all routes starting with /user
app.use('/admin', adminRoutes);// Use adminRoutes for all routes starting with /admin



// Start the server
app.listen(2020, () => {
    console.log('Server is listening on port 2020');
});
