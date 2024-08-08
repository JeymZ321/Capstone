
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Users = require('./models/user');
const crypto = require('crypto');
const appointment = require('./models/Appointment');
const customer = require('./models/Customer');
const scheduled = require('./models/Schedule');
const vehicle = require('./models/Vehicle');
const path = require('path');
const port = 3000


const app = express()

/* Middleware*/
/* Json object that client throws */

app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))


app.use(express.static(path.join(__dirname, 'public')));

const uri = "mongodb://localhost:27017/JAbol";

// Connect to MongoDB using Mongoose
mongoose.connect(uri).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  app.post('/create-account', async (req, res) => {
    const { username, password } = req.body;
    try {
      const iv = crypto.randomBytes(16);
      const encryptionKey = crypto.randomBytes(32);
      const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
      let encryptedPassword = cipher.update(password, 'utf8', 'hex');
      encryptedPassword += cipher.final('hex');
  
      const newUser = new Users({
        username,
        password: encryptedPassword,
        iv: iv.toString('hex'),
        key: encryptionKey.toString('hex')
      });
      await newUser.save();
      res.status(200).json({ message: 'Account created successfully' });
    } catch (error) {
      console.log('Account creation failed', error);
      res.status(500).json({ message: 'Account creation failed' });
    }
  });
  
  app.post('/loginroute', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await Users.findOne({ username });
      if (!user) {
        return res.status(400).json({ message: 'Invalid username or password' });
      }
      const iv = Buffer.from(user.iv, 'hex');
      const key = Buffer.from(user.key, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decryptedPassword = decipher.update(user.password, 'hex', 'utf8');
      decryptedPassword += decipher.final('utf8');
      if (decryptedPassword === password) {
        const redirectUrl = 'https:fb.com';
        res.status(200).json({ message: 'Login successful', redirectUrl: redirectUrl });
      } else {
        res.status(400).json({ message: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  });
  

app.listen(port, () => {
    console.log("Listening on port: ", port)
})