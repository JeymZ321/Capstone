const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    profilePicture: { type: String, default: 'assets/img/default-user-icon.png' },
    suggestions: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String }, // Optional: if you implement email verification
    registrationDate: { type: Date, default: Date.now } // Optional: to keep track of when the user registered
});

const Customer = mongoose.model('Customer', CustomerSchema);
module.exports = Customer;
 