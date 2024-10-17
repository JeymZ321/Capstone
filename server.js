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
const jwt = require('jsonwebtoken');
const appointment = require('./models/Appointment');  
const customer = require('./models/Customer');
const vehicle = require('./models/Vehicle');
const Admin = require('./models/Admin');
const UnverifiedAdmin = require('./models/UnverifiedAdmin'); 
//const profileRoutes = require('./public/profile');
const router = express.Router();
const path = require('path');

const port = 3000;

const app = express();

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

app.get('/appointment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'appointment.html'));
});
app.use('/appointmentcss', express.static(path.join(__dirname, 'public', 'Appointment', 'appointment.css')));

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

/*----------CREATING AN ACCOUNT FOR USERS || CHANGE INTO /appointment--------------*/
app.post('/create-account', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const iv = crypto.randomBytes(16);
    const encryptionKey = crypto.randomBytes(32);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encryptedPassword = cipher.update(password, 'utf8', 'hex');
    encryptedPassword += cipher.final('hex');

    const newcustomer = new customer({
      username,
      password: encryptedPassword,
      email,
      iv: iv.toString('hex'),
      key: encryptionKey.toString('hex')
    });

    await newcustomer.save();
    res.status(200).json({ message: 'Account created successfully' });
  } catch (error) {
    console.log('Account creation failed', error);
    res.status(500).json({ message: 'Account creation failed' });
  }
});

  /*----------------LOGIN AN ACCOUNT FOR USERS--------------*/
  app.post('/loginroute', async (req, res) => {
    const { username, password, googleApiKey } = req.body;
    
    try {
        const Customer = await customer.findOne({ username });
        if (!Customer) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Use bcrypt to compare the password
        const isMatch = await bcrypt.compare(password, Customer.password); 
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

         // Verify the Google API Key if provided
         if (googleApiKey) {
          (async () => {
              const fetch = (await import('node-fetch')).default;
              const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${googleApiKey}`);
              const data = await response.json();
      
              if (data.error) {
                  return res.status(400).json({ message: 'Invalid Google API Key' });
              }
      
              // Save userInfo or use it as needed
              const userInfo = {
                  email: data.email,
                  name: data.name,
                  picture: data.picture,
              };
          })();
      }
              
        const redirectUrl = 'homepage.html'; // HOMEPAGE FOR USERS
        res.status(200).json({ message: 'Login successfully', redirectUrl });

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});


/*-------------------------Update profile route--------------------------*/
/*-----Middleware to verify JWT token----*/
/**
 * Update profile route
 *
 * This route is protected by the authMiddleware, which verifies the JWT token
 * sent in the Authorization header. If the token is valid, the request is passed
 * to the next middleware function. If the token is invalid or missing, a 401
 * status code is returned.
 *
 * The route expects the following parameters:
 * - id: The ID of the user to update
 * - username: The new username
 * - email: The new email address
 * - password: The new password (optional)
 *
 * If the email address is different from the existing one, it is checked against
 * the database to prevent duplicate email addresses. If the email address
 * already exists, a 400 status code is returned.
 *
 * If the password is provided, it is hashed and stored in the database.
 *
 * The route returns a 200 status code if the update is successful, or a 500
 * status code if an error occurs.
 */
// const authMiddleware = (req, res, next) => {
//   const token = req.header('Authorization');
//   if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

//   try {
//       const decoded = jwt.verify(token.replace('Bearer ', ''), 'yourSecretKey'); // Replace 'yourSecretKey' with your actual secret key
//       req.user = decoded;
//       next();
//   } catch (error) {
//       return res.status(400).json({ message: 'Invalid token.' });
//   }
// };

// router.put('/profile/update/:id', authMiddleware, async (req, res) => {
//   try {
//       const { username, email, password } = req.body;
//       const customer = await Customer.findById(req.params.id);

//       if (!customer) {
//           return res.status(404).json({ message: 'User not found' });
//       }

//       // Update email only if it's different and doesn't exist
//       if (email && email !== customer.email) {
//           const existingEmail = await Customer.findOne({ email });
//           if (existingEmail) {
//               return res.status(400).json({ message: 'Email already exists' });
//           }
//           customer.email = email;
//       }

//       // Update username
//       if (username) {
//           customer.username = username;
//       }

//       // Update password if provided, and encrypt it
//       if (password) {
//           const salt = await bcrypt.genSalt(10);
//           const hashedPassword = await bcrypt.hash(password, salt);
//           customer.password = hashedPassword;
//       }

//       // Save the updated profile
//       await customer.save();
//       res.status(200).json({ message: 'Profile updated successfully' });
//   } catch (error) {
//       res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

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

/*----------------------APPOINTMENT FORM CONVERT THE PANEL INTO INPUT TEXT---------------*/
app.post('/appointment', async (req, res) => {
  const {
    Fullname,
    Address,
    Contact,
    Email,
    Brand,
    Color,
    YearModel,
    Plate,
    panel1,
    panel2,
    panel3,
    panel4,
    functionality,  // Updated: combined functional and nonfunctional into one
    datepicker,
    timepicker,
    slots
  } = req.body;

  
  try {
    // Create and save the new appointment
    const newAppointment = new appointment({
      Fullname,
      Address,
      Contact,
      Email,
      datepicker,
      timepicker,
      slots
    });
    await newAppointment.save();

    // Combine panels into an object
    const CarBodyPanel = {
      panel1: panel1 === true,
      panel2: panel2 === true,
      panel3: panel3 === true,
      panel4: panel4 === true
    };

    // Create and save the new vehicle
    const newVehicle = new vehicle({
      Brand,
      Color,
      YearModel,
      PlateNumber: Plate,
      CarBodyPanel,  // Store panels in a nested object
      CarFunctionality: functionality  // Store functionality as a single value
    });
    await newVehicle.save();

    // Send success response
    res.status(200).json({ message: 'Appointment created successfully' });
  } catch (error) {
    console.log('Appointment creation failed:', error);
    res.status(500).json({ message: 'Appointment creation failed' });
  }
});

/*------------------------- Email transporter setup ---------------------*/
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
  
/*---------------------------CHANGE INTO /create-account---------------*/
const secretKey = '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';
app.post('/send-registration-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
      return res.status(400).send({ message: 'Email is required' });
  }

  // Generate a token for registration confirmation
  const token = jwt.sign({ email }, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour

  const registrationLink = `http://127.0.0.1:3000/public/registrationform.html?token=${token}`;

  /*---------Sending email------------*/
  const mailOptions = {
      from: {
          name: 'Reynaldo\'s Car Care',
          address: 'caynojames07@gmail.com' // Make sure to include '.com'
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
      let Customer = await customer.findOne({ email });
      if (!Customer) {
          return res.status(400).send({ message: 'Email not found. Please register first.' });
      }

      // Check if the user is already verified
      if (Customer.isVerified) {
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
