const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phonenumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    city: { type: String },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String }, // Optional: if you implement email verification
    registrationDate: { type: Date, default: Date.now } // Optional: to keep track of when the user registered
});

const Customer = mongoose.model('Customer', CustomerSchema);
module.exports = Customer;
 