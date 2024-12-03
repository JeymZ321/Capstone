const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt'); 
const Service = require("./models/Service");
const Mechanic = require("./models/Mechanic");
const Car = require("./models/Car");
const Appointment = require('./models/Appointment'); 
const NewCustomers = require('./models/NewCustomers');
const ArchivedCustomers = require('./models/archives');
const customer = require('./models/Customer');
const Vehicle = require('./models/Vehicle');
const Admin = require('./models/Admin');
const Archive = require('./models/archives');
const UnverifiedAdmin = require('./models/UnverifiedAdmin'); 
//const profileRoutes = require('./public/profile');
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
  origin: 'https://humorous-precisely-anchovy.ngrok-free.app ', // Replace with your frontend’s domain
  credentials: true  // Allows cookies and other credentials to be sent
}));

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));
//app.use('/profile', profileRoutes);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files from the uploads directory

const uri = "mongodb+srv://capstone:capstone@cluster0.jl0q03o.mongodb.net/UsersDB?retryWrites=true&w=majority&appName=Cluster0";

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

// Ensure the 'uploads' directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// File filter function to only allow certain types of images (jpeg, png, jpg)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept the file
  } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and JPEG are allowed.'), false); // Reject the file
  }
};
// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage:storage, fileFilter:fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
 });


            /*------------------------------CUSTOMER ROUTES------------------------------*/

/*----------CREATING AN ACCOUNT FOR USERS/ REGISTRATION FORM--------------*/

app.post('/registration', async (req, res) => {
  try {
      console.log('Request Body:', req.body);

      const { name, phonenumber, email, city, password, vehicles } = req.body;

      if (!email) {
          return res.status(400).json({ message: 'Email is required' });
      }

      if (!Array.isArray(vehicles) || vehicles.length === 0) {
          return res.status(400).json({
              message: 'At least one vehicle must be added.',
              errorDetails: 'No vehicle data received.'
          });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Check if the email is already registered
      const existingCustomer = await customer.findOne({ email });
      if (existingCustomer) {
          return res.status(400).json({ message: 'Email is already registered' });
      }

      // Create a new customer with embedded vehicles
      const newCustomer = new customer({
          name,
          phonenumber,
          email,
          city,
          password: hashedPassword,
          vehicles // Embed vehicles directly
      });

      await newCustomer.save();

      res.status(200).json({
          message: 'Welcome to Reynaldos Car Care! Thank you for your registration.',
          customer: newCustomer
      });

  } catch (error) {
      console.error('Error occurred during registration:', error);
      res.status(500).json({ message: 'Account creation failed', error: error.message });
  }
});

app.get('/customer/:email', async (req, res) => {
  try {
      const email = req.params.email;
      const customerData = await customer.findOne({ email });

      if (!customerData) {
          return res.status(404).json({ message: 'Customer not found' });
      }

      res.status(200).json(customerData);
  } catch (error) {
      console.error('Error fetching customer data:', error);
      res.status(500).json({ message: 'Failed to fetch customer data', error: error.message });
  }
});

app.post('/uploadVehicle', upload.single('image'), async (req, res) => {
  try {
      const { brandModel, color, plateNumber, yearModel, transmission } = req.body;

      if (!brandModel || !color || !plateNumber || !yearModel || !transmission) {
          return res.status(400).json({ message: 'All vehicle fields are required.' });
      }

       // Get the uploaded image path (e.g., '/uploads/123456789-image.jpg')
       let imageUrl = null;
       if (req.file) {
           imageUrl = `/uploads/${req.file.filename}`; // Path to the image in the server
       }

      // Add the vehicle to the database
      const vehicle = {
          brandModel,
          color,
          plateNumber,
          yearModel,
          transmission,
          imageUrl
      };

      // Assuming you have a `Customer` schema with vehicles embedded
      await customer.updateOne(
          { email: req.body.email }, // Assuming email is used to find the customer
          { $push: { vehicles: vehicle } }
      );

      res.status(200).json({ message: 'Vehicle saved successfully.', vehicle });
  } catch (error) {
      console.error('Error uploading vehicle:', error);
      res.status(500).json({ message: 'Error saving vehicle.' });
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
        redirectUrl: 'appointment.html',
        customerId: user._id,
        name: user.name, 
        email: user.email});
  } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Error logging in' });
  }
});

// Fetch User Profile
app.get('/api/profile', async (req, res) => {
  const { name } = req.query;

  try {
      const user = await customer.findOne({ name });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ 
          name: user.name, 
          email: user.email
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
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
      subject: 'Verify your Admin Account',
      text: ` Dear Admin,

      Verification code: ${verificationCode} .For your security, please don't share this code with anyone else. If you did not make this request, ignore this message.`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send verification email' });
      }

      // Store the admin's ObjectId in the session
    req.session.adminId = admin._id.toString();
    console.log('Session adminId:', req.session.adminId);
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

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next(); // User is authenticated
  }
  res.status(401).json({ message: "Unauthorized access. Please log in." });
};

app.post('/admin/update', isAuthenticated, async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.session.adminId);
    const { username, email, currentPassword, newPassword, fullname, contact } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    let updatedFields = { username, email, fullname, contact };
    if (newPassword) {
      updatedFields.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updatedFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ message: "Profile updated successfully", admin: updatedAdmin });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

  
app.post('/logoutadmin', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error logging out:', err);
        return res.status(500).json({ message: 'Failed to log out' });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
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


/*----------------------Getting database of appointments for admin---------------*/
app.get('/display/appointment', async (req, res) => {
  try {
    const appointments = await Appointment.find({status: 'pending'});
    console.log('Appointments', appointments);
    res.render('appointment/index', { appointments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.patch('/appointments/:id/archive', async (req, res) => {
  try {
      const appointmentId = req.params.id;

      // Update the status to 'archived'
      const arcappointments = await Appointment.findByIdAndUpdate(
          appointmentId,
          { status: 'archived' },
          { new: true } // Return the updated document
      );

      if (arcappointments) {
          res.json({ message: 'Appointment archived successfully!' });
      } else {
          res.status(404).json({ message: 'Appointment not found.' });
      }
  } catch (error) {
      console.error('Error archiving appointment:', error);
      res.status(500).json({ message: 'Failed to archive appointment.' });
  }
});
app.patch('/appointments/:id/archive2', async (req, res) => {
  try {
      const appointmentId = req.params.id;

      // Update the status to 'archived'
      const arcappointments = await NewCustomers.findByIdAndUpdate(appointmentId,
          { status: 'archived' },
          { new: true }
      );

      if (arcappointments) {
          res.json({ message: 'Appointment archived successfully!' });
      } else {
          res.status(404).json({ message: 'Appointment not found.' });
      }
  } catch (error) {
      console.error('Error archiving appointment:', error);
      res.status(500).json({ message: 'Failed to archive appointment.' });
  }
});
app.get('/display/archives', async (req, res) => {
  try {
    const arcappointments = await Appointment.find({status: 'archived'});
    const newCustomers = await NewCustomers.find({status:'archived'});
    console.log('Appointments', {arcappointments, newCustomers});
    res.render('archieves/index', {arcappointments, newCustomers});
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

app.patch('/appointments/:id/delete2', async (req, res) => {
  try {
      const appointmentId = req.params.id;

      // Update the status to 'archived'
      const updatedAppointment = await NewCustomers.findByIdAndUpdate(
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

// Accept appointment and store it with 'accept' status
app.patch('/appointments/:id/accept', async (req, res) => {
  try {
      const appointmentId = req.params.id;

      // Update the status to 'accept'
      const updatedAppointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          { status: 'accept' },
          { new: true } // Return the updated document
      );

      if (updatedAppointment) {
          res.json({ message: 'Appointment accepted successfully!' });
      } else {
          res.status(404).json({ message: 'Appointment not found.' });
      }
  } catch (error) {
      console.error('Error accepting appointment:', error);
      res.status(500).json({ message: 'Failed to accept appointment.' });
  }
});
app.get('/display/approved', async (req, res) => {
  try {
    const acceptedAppointments = await Appointment.find({ status: 'accept' });
    const newCustomers = await NewCustomers.find({status:'accept'});

    res.render('accept/index', { acceptedAppointments,newCustomers });
  } catch (err) {
    console.error('Error fetching approved data:', err);
    res.status(500).send('Server error');
  }
});

app.get('/display/approved', async (req, res) => {
  try {
    const approvedAppointments = await Appointment.find({ status: 'accept' });
    const newCustomers = await NewCustomers.find(); 
    res.render('accept/index', { acceptedAppointments: [...approvedAppointments, ...newCustomers] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});




/*---------------------- User dashboard Tracking---------------*/
// Route to handle appointment form submissions
app.post('/appointment', async (req, res) => {
    try {
        console.log('Received request data:', req.body);

        const { email, phonenumber, city, vehicle, carfunc, platenum, datetime, suggestions, selectedServices } = req.body;

        // Parse datetime into separate date and time
        const [date, time] = datetime.split(' ');

        // Check if the slot is already booked
        const existingAppointment = await Appointment.findOne({ date, time, status: 'booked' });
        if (existingAppointment) {
            return res.status(400).json({ message: 'The selected slot is already booked. Please choose another slot.' });
        }

        // Validate `selectedServices`
        const validatedServices = selectedServices.map(service => ({
          name: service.name,
          price: service.price,
          mechanic: service.mechanic || 'Default Mechanic', // Default value if missing
          estimation: service.estimation || 'Not Provided'  // Default value if missing
      }));

        // Create a new appointment instance with the provided data
        const newAppointment = new Appointment({
            email,
            phonenumber,
            city,
            vehicle,
            carfunc,
            platenum,
            suggestions,
            datetime,
            date, // Add date field
            time, // Add time field
            status: 'pending', // Mark as booked
            selectedServices: validatedServices
          // slot  Selected slot
        });

        // Save the appointment to the database
        const savedAppointment = await newAppointment.save();

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
      // Path to the QR code image
      const qrCodePath = path.join(__dirname, 'public', 'Payment', 'qrcode.png');


      // Compose email content with QR code
      const mailOptions = {
        from: 'Reynaldos Car Care', // Replace with your email
        to: email,
        subject: 'Payment Form for Your Appointment',
        html: `
            <p>Hello,</p>
            <p>Thank you for booking an appointment with us. Please proceed to the payment using the Gcash QR code below:</p>
            <p><strong>Appointment Details:</strong></p>
            <ul>
                <li><strong>Date and Time:</strong> ${datetime}</li>
                <li><strong>Plate#:</strong> ${vehicle}</li>
                <li><strong>Processing Fee:</strong> ₱500</li>
            </ul>
            <p>Scan the QR code below to pay:</p>
            <img src="cid:gcashQR" alt="Gcash QR Code" style="width:200px; height:200px;">
            <p>You have 24hrs to pay the processing fee to proceed with your request.</p>
            <p>Please complete the payment within the given time to avoid delays or cancellation</p>
            <br>
            <p>After completing the payment, Please ensure to attach the proof of payment by replying to this email message for verification purposes .</p>
            <br>
            <p><strong>Office Hours:</strong> 8am - 5pm.</p>
            <p>Thank you!<br>Reynaldo's Car Care Center</p>
        `,
        attachments: [
            {
                filename: 'qrcode.png', // Name of the file in the email
                path: qrCodePath, // Path to the QR code file
                cid: 'gcashQR' // Content ID for embedding in the email
            }
        ]
    };

    // Send the email
    await transporter.sendMail(mailOptions);

        // Respond with success message
        return res.status(200).json({ 
          message: 'Appointment created successfully! A payment form with a Gcash QR code has been sent to your Gmail Account.', 
          appointment: savedAppointment,
          redirectUrl: '/userdashboard-request-tracking.html' 
      });
    } catch (error) {
        console.error('Error creating appointment:', error);
        // Respond with error message if something goes wrong
        return res.status(500).json({ message: 'Error creating appointment', error: error.message });
    }
  });

app.put('/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate the status value
        if (!['pending', 'accept', 'archived'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        // Update the appointment's status
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true } // Return the updated document
        );

        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        res.status(200).json({ message: 'Status updated successfully!', appointment: updatedAppointment });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Failed to update status.', error: error.message });
    }
});

app.get('/appointments/blocked-slots', async (req, res) => {
    try {
        const { date } = req.query;
        const appointments = await Appointment.find({ date, status: 'pending' });
        const blockedSlots = appointments.map(appt => appt.time);
        res.json(blockedSlots);
    } catch (error) {
        console.error('Error fetching blocked slots:', error);
        res.status(500).json({ message: 'Error fetching blocked slots' });
    }
});

app.put('/appointments/archive/:id', async (req, res) => {
  try {
      const { id } = req.params;

      await Appointment.findByIdAndUpdate(id, { status: 'archived' });
      res.status(200).json({ message: 'Appointment archived and slot unblocked!' });
  } catch (error) {
      console.error('Error archiving appointment:', error);
      res.status(500).json({ message: 'Failed to archive appointment' });
  }
});

app.get('/appointments', async (req, res) => {
  try {
    const { email } = req.query; // Assuming email is sent as a query param
    const appointments = await Appointment.find({ email }).sort({ createdAt: -1 }); // Fetch user's appointments
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

app.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the appointment ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid appointment ID:', id);
      return res.status(400).json({ message: 'Invalid appointment ID format.' });
    }

    // Attempt to find and delete the appointment
    const deletedAppointment = await Appointment.findByIdAndDelete(id);

    if (!deletedAppointment) {
      console.error('Appointment not found:', id);
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    console.log('Appointment deleted successfully:', deletedAppointment);
    res.status(200).json({
      message: 'Appointment deleted successfully.',
      appointment: deletedAppointment,
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Error deleting appointment.', error: error.message });
  }
});

/*----------User dashboard Profile-----------------*/
// Update Profile
app.post('/customer/update', async (req, res) => {
  const { email, name, phonenumber, city, password } = req.body;

  if (!email) {
      return res.status(400).json({ message: "Email is required" });
  }

  try {
      const updateData = { name, phonenumber, city };

      // Hash the password only if provided
      if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updateData.password = hashedPassword;
      }

      // Find and update the customer record
      const updatedCustomer = await customer.findOneAndUpdate(
          { email },
          { $set: updateData },
          { new: true }
      );

      if (!updatedCustomer) {
          return res.status(404).json({ message: "Customer not found" });
      }

      res.json({ message: "Profile updated successfully", updatedCustomer });
  } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Error updating profile" });
  }
});


/*-------------------- User dashboard Vehicle--------------*/

app.get('/vehicles', async (req, res) => {
  const { customerId } = req.query;
  console.log('Received customerId:', customerId);

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    console.error('Invalid customer ID format.');
    return res.status(400).json({ message: 'Invalid customer ID format.' });
  }

  try {
    const Customer = await customer.findById(customerId, 'vehicles');
    if (!Customer) {
      console.error('Customer not found.');
      return res.status(404).json({ message: 'Customer not found.' });
    }

    console.log('Vehicles:', Customer.vehicles);
    res.status(200).json({ vehicles: Customer.vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Error fetching vehicles.' });
  }
});

app.delete('/vehicles/:id', async (req, res) => {
  const { id } = req.params;
  const { customerId } = req.query; // Assuming customerId is passed as a query parameter

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ message: 'Invalid ID format.' });
  }

  try {
    // Find the customer and remove the vehicle
    const Customer = await customer.findByIdAndUpdate(
      customerId,
      { $pull: { vehicles: { _id: id } } }, // Remove vehicle with matching _id
      { new: true } // Return the updated document
    );

    if (!Customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    res.status(200).json({ message: 'Vehicle deleted successfully.', vehicles: Customer.vehicles }); // Corrected to use 'Customer'
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Error deleting vehicle.', error: error.message });
  }
});



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
    //const registrationLink = `/registrationform.html?token=${token}`;
    //const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; // Dynamic base URL
    //console.log('Base URL:', baseUrl); // Debug log
    const registrationLink = `https://humorous-precisely-anchovy.ngrok-free.app/registrationform.html?token=${token}`;

    /*---------Sending email------------*/
    const mailOptions = {
        from: {
            name: "Reynaldo's Car Care",
            address: 'caynojames07@gmail.com'
        },
        to: email,
        subject: 'Reynaldos Car Care Registration Form', 
        text: `Welcome our dear new customers of Reynaldos Car Care Center! If you want to proceed to fill up you registration form, click this link: ${registrationLink}. If not just ignore this message`
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

// POST route for adding a new customer
app.post('/Newcustomers', upload.single('vehicleImage'), async (req, res) => {
  try {
      const requiredFields = ['name', 'phone', 'email', 'city', 'vehicle', 'checkInTime'];
      for (const field of requiredFields) {
          if (!req.body[field]) {
              return res.status(400).json({ success: false, message: `${field} is required.` });
          }
      }

      const newCustomer = new NewCustomers({
          ...req.body,
          checkInTime: new Date(req.body.checkInTime),
          vehicleImage: req.file ? req.file.path : null
      });

      await newCustomer.save();
      res.status(201).json({ success: true, message: 'Customer added successfully!', customer: newCustomer });
  } catch (error) {
      console.error('Error adding customer:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.patch('/customer/:id/archive', async (req, res) => {
  try {
      const customerId = req.params.id;

      const arcappointments = await NewCustomers.findByIdAndUpdate(
        customerId, 
        { status: 'archived' },
        { new: true } // Return the updated document
    );

    if (arcappointments) {
        res.json({ message: 'Customer archived successfully!' });
    } else {
        res.status(404).json({ message: 'Appointment not found.' });
    }
} catch (error) {
    console.error('Error archiving appointment:', error);
    res.status(500).json({ message: 'Failed to archive appointment.' });
}
});


app.get('/display/archives', async (req, res) => {
  try {
      // Retrieve customers from the archive collection
      const arcappointments = await NewCustomers.find({status: 'archived'});
      console.log('Appointments', arcappointments);
      // Render the archive page with the retrieved customersde
      res.render('archives/index', { arcappointments});
  } catch (err) {
      console.error('Error fetching archived customers:', err);
      res.status(500).send('Server error');
  }
});

app.get('/display/archives', async (req, res) => {
  try {
      res.render('archives/index');
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});


/*-------------------- fetch CMS Mechanics ------------------*/
  app.post('/api/mechanics', async (req, res) => {
    try {
        const { name, specialization, phone, availability } = req.body;
        const mechanic = new Mechanic({ name, specialization, phone, availability });
        await mechanic.save();
        res.status(201).json(mechanic); // Return the saved mechanic
    } catch (error) {
        console.error('Error saving mechanic:', error);
        res.status(500).json({ error: 'Failed to save mechanic' });
    }
  });

  app.get('/api/mechanics', async (req, res) => {
    try {
        const mechanics = await Mechanic.find(); // Fetch all mechanics from the database
        res.json(mechanics); // Send the mechanics data as JSON
    } catch (error) {
        console.error('Error fetching mechanics:', error);
        res.status(500).json({ error: 'Failed to fetch mechanics' });
    }
  });

  app.put('/api/mechanics/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const mechanic = await Mechanic.findByIdAndUpdate(id, updatedData, { new: true });
        if (!mechanic) {
            return res.status(404).json({ error: 'Mechanic not found' });
        }
        res.json(mechanic);
    } catch (error) {
        console.error('Error updating mechanic:', error);
        res.status(500).json({ error: 'Failed to update mechanic' });
    }
  });

  app.delete('/api/mechanics/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const mechanic = await Mechanic.findByIdAndDelete(id);
        if (!mechanic) {
            return res.status(404).json({ error: 'Mechanic not found' });
        }
        res.json({ message: 'Mechanic deleted successfully' });
    } catch (error) {
        console.error('Error deleting mechanic:', error);
        res.status(500).json({ error: 'Failed to delete mechanic' });
    }
  });

/*-------------------- fetch CMS Services ------------------*/
// GET: Fetch all services
app.get('/api/services', async (req, res) => {
  try {
      const services = await Service.find();
      res.json(services);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST: Add a new service
app.post('/api/services', upload.single('image'), async (req, res) => {
  try {
      const { name, price, category, description, mechanic, estimation } = req.body;
      const imagePath = req.file ? `/uploads/${req.file.filename}` : ''; // Save file path if an image is uploaded

      const service = new Service({
          name,
          price,
          category,
          description,
          mechanic,
          estimation,
          image: imagePath,
      });

      await service.save();
      res.status(201).json(service);
  } catch (error) {
      res.status(500).json({ error: 'Failed to add service' });
  }
});

// PUT: Update an existing service
app.put('/api/services/:id', upload.single('image'), async (req, res) => {
  try {
      const { name, price, category, description, mechanic, estimation } = req.body;
      const service = await Service.findById(req.params.id);

      if (!service) {
          return res.status(404).json({ error: 'Service not found' });
      }

      // Update fields
      service.name = name || service.name;
      service.price = price || service.price;
      service.category = category || service.category;
      service.description = description || service.description;
      service.mechanic = mechanic || service.mechanic; // Update mechanic name
      service.estimation = estimation || service.estimation; 

      // Update the image if a new file is uploaded
      if (req.file) {
          service.image = `/uploads/${req.file.filename}`;
      }

      await service.save();
      res.json(service);
  } catch (error) {
      res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE: Remove a service
app.delete('/api/services/:id', async (req, res) => {
  try {
      const service = await Service.findById(req.params.id);

      if (!service) {
          return res.status(404).json({ error: 'Service not found' });
      }

      // Delete service record
      await service.deleteOne();
      res.sendStatus(200);
  } catch (error) {
      res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Add a new car model
app.post('/api/carmodels', async (req, res) => {
  try {
      const { brand, model } = req.body;
      if (!brand || !model) {
          return res.status(400).json({ error: 'Brand and model are required.' });
      }
      const newCar = new Car({ brand, model });
      await newCar.save();
      res.status(201).json(newCar);
  } catch (error) {
      console.error('Error saving car model:', error);
      res.status(500).json({ error: 'Failed to save car model.' });
  }
});

// Get all car models
app.get('/api/carmodels', async (req, res) => {
  try {
      const cars = await Car.find(); // Fetch all car models
      res.json(cars);
  } catch (error) {
      console.error('Error fetching car models:', error);
      res.status(500).json({ error: 'Failed to fetch car models.' });
  }
});

// Get a specific car model by ID
app.get('/api/carmodels/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const car = await Car.findById(id);
      if (!car) {
          return res.status(404).json({ error: 'Car model not found.' });
      }
      res.json(car);
  } catch (error) {
      console.error('Error fetching car model:', error);
      res.status(500).json({ error: 'Failed to fetch car model.' });
  }
});


// Update a car model
app.put('/api/carmodels/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { brand, model } = req.body;
      if (!brand || !model) {
          return res.status(400).json({ error: 'Brand and model are required.' });
      }
      const updatedCar = await Car.findByIdAndUpdate(id, { brand, model }, { new: true });
      if (!updatedCar) {
          return res.status(404).json({ error: 'Car model not found.' });
      }
      res.json(updatedCar);
  } catch (error) {
      console.error('Error updating car model:', error);
      res.status(500).json({ error: 'Failed to update car model.' });
  }
});


// Delete a car model
app.delete('/api/carmodels/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const deletedCar = await Car.findByIdAndDelete(id);
      if (!deletedCar) {
          return res.status(404).json({ error: 'Car model not found.' });
      }
      res.json({ message: 'Car model deleted successfully.' });
  } catch (error) {
      console.error('Error deleting car model:', error);
      res.status(500).json({ error: 'Failed to delete car model.' });
  }
});





/*------------------------CONNECTING TO THE PORT----------------------*/
app.listen(port, () => {
  console.log("Listening on port: ", port);
});
