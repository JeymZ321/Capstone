const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Appointment = require('./models/Appointment');  
const customer = require('./models/Customer');
const vehicle = require('./models/Vehicle');
const Admin = require('./models/Admin');
const Archive = require('./models/archives');
const UnverifiedAdmin = require('./models/UnverifiedAdmin'); 
//const profileRoutes = require('./public/profile');
const router = express.Router();
const path = require('path');



const port = 3000;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
/* MIDDLEWARE */

/*------------------------ROUTES-----------------------*/
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use('/profile', profileRoutes);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads')); // Serve static files from the uploads directory

const uri = "mongodb://localhost:27017/UsersDB";

// app.get('/appointment', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'appointment.html'));
// });
// app.use('/appointmentcss', express.static(path.join(__dirname, 'public', 'Appointment', 'appointment.css')));

// CONNECT TO MONGODB 
mongoose.connect(uri).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

// DIRECTORY TO FRONTEND PAGE
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); //LANDING PAGE
});

/*------------------------------CUSTOMER ROUTES------------------------------*/

/*----------CREATING AN ACCOUNT FOR USERS/ REGISTRATION FORM--------------*/
app.post('/registration', async (req, res) => {
  const { email, suggestions } = req.body; 
  if (!email) {
      return res.status(400).json({ message: 'Email is required' });
  }

  try {
      // Check if the email is already registered
      const existingCustomer = await customer.findOne({ email });
      if (existingCustomer) {
          return res.status(400).json({ message: 'Email is already registered' });
      }

      // Create a new customer with the provided email and suggestions
      const newCustomer = new customer({
          email,
          suggestions,
          isVerified: true  // Set to true for now, or implement email verification if needed
      });

      await newCustomer.save();
      res.status(200).json({ message: 'Account created successfully' });
  } catch (error) {
      console.log('Account creation failed:', error);
      res.status(500).json({ message: 'Account creation failed' });
  }
});

  /*----------------LOGIN AN ACCOUNT FOR USERS--------------*/
  app.post('/loginroute', async (req, res) => {
    const { googleApiKey } = req.body;
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${googleApiKey}`);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ message: 'Invalid Google API Key' });
        }

        const email = data.email;
        
        // Check if the email is registered
        const Customer = await customer.findOne({ email });
        if (!Customer) {
            return res.status(400).json({ message: 'Email is not registered' });
        }

        // Check if the email is verified
        if (!Customer.isVerified) {
            return res.status(400).json({ message: 'Please verify your email before logging in' });
        }

        // Login successful, return the homepage
        res.status(200).json({ message: 'Login successfully', redirectUrl: 'homepage.html' });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

/*------------------------Route to get the user's profile------------------------*/
app.get('/api/profile', async (req, res) => {
  const { email } = req.query;  // Assuming the email is passed as a query parameter

  try {
      // Find the user by email
      const user = await customer.findOne({ email });
      
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Send the user's profile data back
      res.status(200).json({
          email: user.email,
          picture: user.picture || 'assets/img/default-user-icon.png'  // Default image if no profile picture exists
      });
  } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Server error fetching profile' });
  }
});

/*---------------------------------ADMIN LOGIN-------------------------------------*/

/*-----CREATING ACCOUNTS FOR ADMINS------*/
app.post('/adminregistration', async (req, res) => {
  const { username, password, fullname, email, contact } = req.body;
  
  try {
    // Check if admin already exists in both collections
    const existingAdmin = await Admin.findOne({ email });
    const unverifiedAdmin = await UnverifiedAdmin.findOne({ email });

    if (existingAdmin || unverifiedAdmin) {
      return res.status(400).json({ message: 'Email already exists. Please verify your email or use another one.' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate the verification code
    function generateVerificationCode() {
      return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    }

    const verificationCode = generateVerificationCode();

    // Store in the unverified collection
    const newUnverifiedAdmin = new UnverifiedAdmin({
      username,
      password: hashedPassword,
      email,
      fullname,
      contact,
      verificationCode
    });

    await newUnverifiedAdmin.save();

    // Send the verification email
    const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'caynojames07@gmail.com',
      pass: 'fddz jopx zhia rffr',  // Consider using app passwords for Gmail
  },
});
    const mailOptions = {
    from: 'Reynaldos Car Care',
    to: email,
    subject: 'Admin Account Verification Code',
    text:  `Your verification code is: ${verificationCode}`,
};
     transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error('Error sending email:', error);
      }
      console.log('Verification email sent:', info.response);
    });

    res.status(200).json({ message: 'Registration successful. Please verify your email.' });
  } catch (error) {
    console.error('Account creation failed:', error);
    res.status(500).json({ message: 'Account creation failed' });
  }
});

  /*------------------Verification Code Route------------------*/
  app.post('/verify-code', async (req, res) => {
    const { verificationCode } = req.body;
    
    try {
      // Find the unverified admin using the verification code
      const unverifiedAdmin = await UnverifiedAdmin.findOne({ verificationCode });
  
      if (!unverifiedAdmin) {
        return res.status(400).json({ message: 'Invalid or expired verification code.' });
      }
  
      // Create the admin in the main collection
      const newAdmin = new Admin({
        username: unverifiedAdmin.username,
        password: unverifiedAdmin.password,
        email: unverifiedAdmin.email,
        fullname: unverifiedAdmin.fullname,
        contact: unverifiedAdmin.contact,
        isVerified: true
      });
  
      await newAdmin.save();
      
      // Delete the unverified admin record
      await UnverifiedAdmin.deleteOne({ _id: unverifiedAdmin._id });
  
      res.status(200).json({ message: 'Verification successful!' });
    } catch (error) {
      console.error('Verification failed:', error);
      res.status(500).json({ message: 'Verification failed' });
    }
  });
  

/*----------------RESEND VERIFICATION CODE-----------------*/
app.post('/resend-verification-code', async (req, res) => {
  const { email } = req.body; // Get the email from the request

  try {
    // Find the admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    // Generate a new verification code
    function generateVerificationCode() {
      return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit random number
    }
    const newVerificationCode = generateVerificationCode();

    // Update the admin with the new verification code
    admin.verificationCode = newVerificationCode;
    await admin.save();

    // Resend the verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'caynojames07@gmail.com',
        pass: 'fddz jopx zhia rffr', 
      },
    });

    const mailOptions = {
      from: 'Reynaldos Car Care',
      to: admin.email,
      subject: 'New Admin Account Verification Code',
      text: `Your new verification code is: ${newVerificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending email.' });
      }
      console.log('Verification email sent:', info.response);
      res.status(200).json({ message: 'New verification code sent.' });
    });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ message: 'Error resending verification code.' });
  }
});



/*---------------ADMIN LOGIN ROUTE-----------*/
app.post('/loginadmin', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    if (!admin.isVerified) { 
      return res.status(403).json({ message: 'Please verify your account before logging in.' });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (isMatch) {
      res.status(200).json({ message: 'Login successful', redirectUrl: 'index.html' });
    } else {
      res.status(400).json({ message: 'Invalid username or password' });
    }
  } catch (error) { 
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

/*------------------------Admin Calendar-----------------------*/

// POST route to handle admin availability submission
app.post('/api/admin/availability', (req, res) => {
  const { date, time, availableSlots } = req.body;

  // Check if the required fields are provided
  if (!date || !time || !availableSlots) {
      return res.status(400).json({ message: 'Date, time, and available slots are required.' });
  }

  // Save the availability
  availableAppointments.push({ date, time, availableSlots });
  console.log('Availability submitted:', { date, time, availableSlots });

  res.status(201).json({ message: 'Availability submitted successfully!' });
});

// GET route to retrieve all available appointments
app.get('/api/admin/availability', (req, res) => {
  res.status(200).json(availableAppointments);
});

/*----------------------APPOINTMENT ROUTE FOR ADMIN---------------*/
app.get('/api/appointments', async (req, res) => {
  try {
      const appointments = await Appointment.find({}, '-password -iv -key'); // Exclude sensitive fields
      res.status(200).json(appointments);
  } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// Archive appointment and store it in 'archives' collection



/*----------------------Getting database of appointments for admin---------------*/
app.get('/display/appointment', async (req, res) => {
  try {
    const appointments = await Appointment.find({status: 'active'});
    console.log('Appointments', appointments);
    res.render('appointment/index', { appointments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Archive appointment and store it in 'archives' collection
app.patch('/appointments/:id/archive', async (req, res) => {
  try {
      const appointmentId = req.params.id;

      // Update the status to 'archived'
      const updatedAppointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          { status: 'archived' },
          { new: true } // Return the updated document
      );

      if (updatedAppointment) {
          res.json({ message: 'Appointment archived successfully!' });
      } else {
          res.status(404).json({ message: 'Appointment not found.' });
      }
  } catch (error) {
      console.error('Error archiving appointment:', error);
      res.status(500).json({ message: 'Failed to archive appointment.' });
  }
});



/*----------------------Getting database of archives for admin---------------*/
app.get('/display/archives', async (req, res) => {
  try {
    const arcappointments = await Appointment.find({status: 'archived'});
    console.log('Appointments', arcappointments);
    res.render('archieves/index', { arcappointments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
app.patch('/appointments/:id/delete', async (req, res) => {
    try {
        const appointmentId = req.params.id;

        // Update the status to 'archived'
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { status: 'deleted' },
            { new: true } // Return the updated document
        );

        if (updatedAppointment) {
            res.json({ message: 'Appointment delete  successfully!' });
        } else {
            res.status(404).json({ message: 'Appointment not found.' });
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ message: 'Failed to adelete  appointment.' });
    }
});



/*----------------------APPOINTMENT FORM---------------*/
// Route to handle appointment form submissions
app.post('/appointment', async (req, res) => {
  try {
      console.log('Received request data:', req.body);

      const { email, phonenumber, city, vehicle, carfunc, platenum, datetime, slot } = req.body;

      // Create a new appointment instance with the provided data
      const newAppointment = new Appointment({
          email,
          phonenumber,
          city,
          vehicle,
          carfunc,
          platenum,
          datetime, // Combined DateTime field
          slot // Selected slot
      });

      // Save the appointment to the database
      const savedAppointment = await newAppointment.save();

      // Respond with success message and saved appointment data
      return res.status(200).json({ message: 'Appointment created successfully!', appointment: savedAppointment });
  } catch (error) {
      console.error('Error creating appointment:', error);
      // Respond with error message if something goes wrong
      return res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
});


/*---------------------------CHANGE INTO /create-account---------------*/
const secretKey = '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';
const jwt = require('jsonwebtoken');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
      user: 'caynojames07@gmail.com',
      pass: 'fddz jopx zhia rffr',  // Consider using app passwords for Gmail
  },
});

app.post('/send-registration-email', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).send({ message: 'Email is required' });
    }

    try {
        // Generate a token for registration confirmation
        const token = jwt.sign({ email }, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour

        const registrationLink = `http://127.0.0.1:3000/public/registrationform.html?token=${token}`;

        /*---------Sending email------------*/
        const mailOptions = {
            from: {
                name: "Reynaldo's Car Care",
                address: 'caynojames07@gmail.com'
            },
            to: email,
            subject: 'Complete Your Registration',
            text: `You received this email because you visited our site. Click the link to proceed with registration: ${registrationLink}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
                return res.status(500).send('Error sending email.');
            }
            console.log('Email sent: ' + info.response);
            res.status(200).send('Registration email sent.');
        });
    } catch (error) {
        console.log('Error in registration email:', error);
        res.status(500).send('An error occurred while sending the registration email.');
    }
});


app.get('/confirm-registration', async (req, res) => {
  const { token } = req.query;

  if (!token) {
      return res.status(400).send({ message: 'Invalid token' });
  }

  try {
      // Verify the token
      const decoded = jwt.verify(token, secretKey);
      const { email } = decoded;

      // Find the user by email
      let customer = await Customer.findOne({ email });
      if (!customer) {
          return res.status(400).send({ message: 'Email not found. Please register first.' });
      }

      // Check if the user is already verified
      if (customer.isVerified) {
          return res.status(400).send({ message: 'Email is already verified' });
      }

      // Update the user's verification status
      customer.isVerified = true;
      await customer.save();

      res.status(200).send('Registration confirmed. You can now log in using your Gmail account.');
  } catch (error) {
      console.log('Error confirming registration:', error);
      res.status(500).send('Error confirming registration.');
  }
});

/*------------------------CONNECTING TO THE PORT----------------------*/
app.listen(port, () => {
  console.log("Listening on port: ", port);
});
