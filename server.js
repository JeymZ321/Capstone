const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const appointment = require('./models/Appointment');
const customer = require('./models/Customer');
const vehicle = require('./models/Vehicle');
const admin = require('./models/Admin');
const path = require('path');
const port = 3000;

const app = express();

/* MIDDLEWARE */
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const uri = "mongodb://localhost:27017/UsersDB";

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

// CREATING AN ACCOUNT
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

// LOGIN AN ACCOUNT
app.post('/loginroute', async (req, res) => {
  const { username, password } = req.body;
  try {
    const Customer = await customer.findOne({ username });
    if (!Customer) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const iv = Buffer.from(Customer.iv, 'hex');
    const key = Buffer.from(Customer.key, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decryptedPassword = decipher.update(Customer.password, 'hex', 'utf8');
    decryptedPassword += decipher.final('utf8');

    if (decryptedPassword === password) {
      const redirectUrl = 'homepage.html'; //HOMEPAGE FOR USERS
      res.status(200).json({ message: 'Login successfully', redirectUrl: redirectUrl });
    } else {
      res.status(400).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// APPOINTMENT FORM
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

  // Validate input
  if (!datepicker || !timepicker) {
    return res.status(400).json({ error: 'Date and time are required.' });
  }

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
      panel1: panel1 || false,
      panel2: panel2 || false,
      panel3: panel3 || false,
      panel4: panel4 || false
    };

    // Create and save the new vehicle
    const newVehicle = new vehicle({
      Brand,
      Color,
      YearModel,
      PlateNumber: Plate,
      CarBodyPanel,        // Store panels in a nested object
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




// CONNECTING TO THE PORT
app.listen(port, () => {
  console.log("Listening on port: ", port);
});
