const express = require('express');
const session = require('express-session');
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
const Vehicle = require('./models/Vehicle');
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
app.use(session({
  secret: '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',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend’s domain
  credentials: true  // Allows cookies and other credentials to be sent
}));
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
  const { name, phonenumber, email, city, password, vehicles } = req.body; 
  
  if (!email) {
      return res.status(400).json({ message: 'Email is required' });
  }


  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
      // Check if the email is already registered
      const existingCustomer = await customer.findOne({ email });
      if (existingCustomer) {
          return res.status(400).json({ message: 'Email is already registered' });
      }

      // Create a new customer with provided information
      const newUser = new customer({
      
          name,
          phonenumber,
          email,
          city,
          password: hashedPassword,
          isVerified: true
      });

      await newUser.save();

      // Validate and save each vehicle associated with the new customer, if vehicles are provided
    
      for (let vehicle of vehicles) {
      if (!vehicle.brandModel || !vehicle.color || !vehicle.plateNumber || !vehicle.yearModel || !vehicle.transmission ) {
          return res.status(400).json({ message: 'All vehicle fields are required.' });
      }

      const newVehicle = new Vehicle({
          customerId: newUser._id,
          brandModel: vehicle.brandModel,
          color: vehicle.color,
          plateNumber: vehicle.plateNumber,
          yearModel: vehicle.yearModel,
          transmission: vehicle.transmission    
      });
      await newVehicle.save();
  }



      // Remove the stored code after successful registration
      delete verificationCodes[email];

      // Set the session with the user's email
      req.session.email = newUser.email;

      res.status(200).json({ message: 'Welcome to Reynaldos Car Care!, Thankyou for you registration' });
  } catch (error) {
      console.log('Account creation failed:', error);
      res.status(500).json({ message: 'Account creation failed' });
  }
});

// This will hold the code for each email temporarily (for demo purposes only)
const verificationCodes = {};

// app.post('/send-code', async (req, res) => {
//     const { email } = req.body;
//     if (!email) {
//         return res.status(400).json({ message: 'Email is required' });
//     }

//     // Generate a 6-digit random code
//     const code = Math.floor(100000 + Math.random() * 900000).toString();

//     // Store the code for this email
//     verificationCodes[email] = code;

//     // Configure Nodemailer
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       host: 'smtp.gmail.com',
//       port: 587,
//       secure: false,
//       auth: {
//         user: 'caynojames07@gmail.com',
//         pass: 'fddz jopx zhia rffr',  
//     },
//     });

//     // Email options
//     const mailOptions = {
//         from: 'Reynaldos Car Care',
//         to: email,
//         subject: 'Your Verification Code',
//         text: `Your verification code is: ${code}`
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         res.status(200).json({ message: 'Verification code sent to email.' });
//     } catch (error) {
//         console.log('Error sending email:', error);
//         res.status(500).json({ message: 'Failed to send verification code.' });
//     }
// });


/*----------------LOGIN AN ACCOUNT FOR USERS--------------*/
app.post('/loginroute', async (req, res) => {
  try {
      // Get email and password from the request body
      const { email, password } = req.body;

      // Find the user by email only
      const user = await customer.findOne({ email });

      // Check if the email is registered
      if (!user) {
          return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // Verify password (assuming the password is hashed)
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          return res.status(400).json({ message: 'Incorrect password' });
      }
      
      // Check if the email is verified
      if (!user.isVerified) {
          return res.status(400).json({ message: 'Please verify your email before logging in' });
      }

      // Set the session with the user's email
      req.session.email = email;
      console.log('Session email set:', req.session.email);

      // Login successful, return the homepage
      res.status(200).json({ 
        message: 'Login successful', 
        redirectUrl: 'homepage.html', 
        name: user.name, 
        email: user.email});
  } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Error logging in' });
  }
});


/*------------------------Route to get the user's profile------------------------*/
// app.get('/api/profile', async (req, res) => {
//   const { name } = req.query;

//   try {
//       // Find the user by username
//       const user = await customer.findOne({ name});
      
//       if (!user) {
//           return res.status(404).json({ message: 'User not found' });
//       }

//       // Send back both email and picture, along with username if needed
//       res.status(200).json({
//           name: user.name,
//           email: user.email,
//           //picture: user.picture || 'assets/img/default-user-icon.png'  // Default profile image
//       });
//   } catch (error) {
//       console.error('Error fetching user profile:', error);
//       res.status(500).json({ message: 'Server error fetching profile' });
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

/*------------------Verification Code For Admin Registration Route------------------*/
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
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    if (!admin.isVerified) {
      return res.status(403).json({ message: 'Your account is not verified. Please contact support.' });
    }

    // Generate and store a new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    admin.verificationCode = verificationCode;
    await admin.save();

    // Send email with verification code
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'caynojames07@gmail.com',
        pass: 'fddz jopx zhia rffr', // Use an app-specific password
      },
    });

    const mailOptions = {
      from: 'Reynaldo\'s Car Care',
      to: email,
      subject: 'Admin Login Verification Code',
      text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send verification email' });
      }

      // Redirect to verification page after sending code
      res.status(200).json({
        message: 'Verification code sent to email. Please enter it to complete login.',
        redirectUrl: 'loginverificationcode.html'
      });
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});


/*------------------------Verification Code For Admin Login-----------------------*/
app.post('/adminverifycode', async (req, res) => {
  const { email, code } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin || admin.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Clear the verification code after successful verification
    admin.verificationCode = null;
    await admin.save();

    // Redirect to admin dashboard
    res.status(200).json({
      message: 'Verification successful',
      redirectUrl: 'admindashboard.html'
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ message: 'Verification failed' });
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
app.get('/display/archives', async (req, res) => {
  try {
    res.render('archieves/index');
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

      const { email, phonenumber, city, vehicle, carfunc, platenum, datetime, suggestions, slot } = req.body;

      // Create a new appointment instance with the provided data
      const newAppointment = new Appointment({
          email,
          phonenumber,
          city,
          vehicle,
          carfunc,
          platenum,
          suggestions,
          datetime, // Combined DateTime field
          slot // Selected slot
      });

      // Save the appointment to the database
      const savedAppointment = await newAppointment.save();

      // Respond with success message and saved appointment data
      return res.status(200).json({ message: 'Appointment created successfully!, You can now proceed to the payment', appointment: savedAppointment, redirectUrl: '/payment.html' });
  } catch (error) {
      console.error('Error creating appointment:', error);
      // Respond with error message if something goes wrong
      return res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
});

// app.get('/getUserData', (req, res) => {
//   // Assume `req.user` contains user info if authenticated
//   if (req.user) {
//       res.json({
//           name: req.user.name,
//           phonenumber: req.user.phonenumber,
//           email: req.user.email,
//           city: req.user.city,
//       });
//   } else {
//       res.status(401).send('User not authenticated');
//   }
// });


/*---------------------------CHANGE INTO /create-account---------------*/
const secretKey = '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';
const jwt = require('jsonwebtoken');
//const { userInfo } = require('os');
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

app.post('/send-registration-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
      return res.status(400).send({ message: 'Email is required' });
  }

  try {
    const existingCustomer = await customer.findOne({ email });
    if (existingCustomer) {
        // Send a 409 status for "Conflict" when email is already registered
        return res.status(409).send({ message: 'Your Gmail account is already registered.' });
    }
    
    // Generate a token for registration confirmation
    const token = jwt.sign({ email }, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour
    const registrationLink = `http://localhost:3000/registrationform.html?token=${token}`;

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
    let Customer = await customer.findOne({ email });
    if (!Customer) {
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
