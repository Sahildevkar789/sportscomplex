const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const QRCode = require('qrcode');
const User = require('../models/User.js');
const path = require("path");
const { isLoggedIn } = require('../middleware/auth.js');
const fs = require('fs');
const Turf = require('../models/Turf.js');


router.get('/download', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const latestBooking = user.bookingHistory[user.bookingHistory.length - 1];
        const title = await Turf.findById(latestBooking.turfId); 
        

        // Create a new PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const fileName = `receipt-${latestBooking._id}.pdf`;

        // Set response headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        // Pipe PDF document to response
        doc.pipe(res);

        // Header with Logo and Address
        const logoPath = path.join(__dirname, 'public', 'style', 'assets', 'fcritlogo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 40, { width: 80 });
        }

        // Header Text (Fr. Agnels Sports Complex and Address)
        doc
            .fontSize(18)
            .fillColor('#333')
            .text('Fr. Agnels Sports Complex', { align: 'center' })
            .text('Vashi, Navi Mumbai - 400407', { align: 'center' })
            .text('Phone: +91 123 456 7890', { align: 'center' })
            .moveDown(1);

        // Line separator
        doc
            .moveTo(50, 110)
            .lineTo(550, 110)
            .lineWidth(2)
            .strokeColor('#0073e6')
            .stroke();

        // Title for the receipt
        doc
            .fontSize(22)
            .text('Booking Receipt', { align: 'center' })
            .moveDown(1);

        // Draw another line for separation
    
doc
    .moveTo(50, 40)
    .lineTo(550, 40)
    .lineWidth(2)
    .strokeColor('#808080')
    .stroke()
    .moveTo(50, 40)
    .lineTo(50, 750)
    .lineWidth(2)
    .strokeColor('#808080')
    .stroke()
    .moveTo(550, 40)
    .lineTo(550, 750)
    .lineWidth(2)
    .strokeColor('#808080')
    .stroke()
    .moveTo(50, 750)
    .lineTo(550, 750)
    .lineWidth(2)
    .strokeColor('#808080')
    .stroke()
        // Main Booking Details
  doc
    .moveDown(2)
    .fontSize(16)
    .fillColor('#000')
    .text(`   Name: ${latestBooking.username}`, { continued: false })
    .moveDown(0.5)
    .text(`   Turf Name: ${title.title}`, { continued: false })
    .moveDown(0.5)
    .text(`   Date: ${new Date(latestBooking.dateSlot).toLocaleDateString()}`)
    .moveDown(0.5)
    .text(`   Time Slot: ${latestBooking.timeSlot}`)
    .moveDown(0.5)
    .text(`   Payment Mode: Wallet`, { fillColor: '#28a745' })
    .moveDown(0.5)
    .text(`   Status: ${latestBooking.status}`, { fillColor: latestBooking.status === 'Confirmed' ? '#28a745' : '#dc3545' })
    .moveDown(0.5)
    .text(`   Total Amount: ${latestBooking.price}`, { fillColor: '#ff9800', fontSize: 18, bold: true });
        // Generate QR Code Data
        const qrData = {
            bookingId: latestBooking._id,
            turfName: title.title,
            username: latestBooking.username,
            dateSlot: latestBooking.dateSlot,
            timeSlot: latestBooking.timeSlot,
            status: latestBooking.status,
            amount: latestBooking.price
        };

        // Convert JSON data to string for QR code
        const qrCodeString = JSON.stringify(qrData);

        // Generate QR Code and embed it into the PDF
        QRCode.toDataURL(qrCodeString, { errorCorrectionLevel: 'H' }, (err, qrUrl) => {
            if (err) {
                console.error('Error generating QR code:', err);
            } else {
                // Adding QR Code to PDF
                doc
                    .moveDown(2)
                    .text('Scan this QR code for booking details:', { align: 'center' })
                    .image(qrUrl, doc.page.width / 2 - 50, doc.y, { width: 100 })
                    .moveDown(1);
                
                // Footer with Thank You message
                doc
                    .moveDown(5)
                    .fillColor('#6c757d')
                    .fontSize(12)
                    .text('Thank you for booking with Fr. Agnels Sports Complex!', { align: 'center' })
                    .text('Visit again for more exciting sports bookings!', { align: 'center' });

                // Final line separator
                doc
                    .moveTo(50, doc.y + 10)
                    .lineTo(550, doc.y + 10)
                    .lineWidth(2)
                    .strokeColor('#0073e6')
                    .stroke();

                // End the PDF document
                doc.end();
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating PDF');
    }
});

router.get('/send-email', isLoggedIn, async (req, res) => {
  try {
      // Retrieve user and latest booking info
      const user = await User.findById(req.session.userId);
      const latestBooking = user.bookingHistory[user.bookingHistory.length - 1];
      const title = await Turf.findById(latestBooking.turfId); 
        
      // Check if booking history exists
      if (!latestBooking) {
          return res.status(404).send('No booking history found');
      }

      // Nodemailer configuration for Ethereal Email
      const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
              user: 'shanny.cummerata62@ethereal.email',
              pass: 'KATT3rQAHG3Sw9fBq9'
          }
      });

      // Prepare email content
      const emailContent = `
      Booking Receipt
      -------------------------
      Turf Name: ${title.title}
      Date: ${new Date(latestBooking.dateSlot).toLocaleDateString()}
      Time Slot: ${latestBooking.timeSlot}
      Payment Mode: Wallet
      Status: ${latestBooking.status}
      Total Amount: ₹${latestBooking.price}
  `;


      const mailOptions = {
          from: '"Sports Turf Booking" <shanny.cummerata62@ethereal.email>',
          to: 'recipient@example.com', // Replace with the recipient's email
          subject: 'Your Booking Receipt',
          text: emailContent
      };

      // Send email
      transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
              console.error('Error sending email:', err);
              res.status(500).send('Error sending email');
          } else {
              console.log('Email sent:', info.messageId);
              console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
              res.send('Email sent successfully!');
          }
      });

  } catch (err) {
      console.error(err);
      res.status(500).send('Error sending email');
  }
});


module.exports = router;
