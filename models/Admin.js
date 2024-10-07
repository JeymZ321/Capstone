const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    contact: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now },
    verificationCode: String,  // Store the code here
    isVerified: { type: Boolean, default: false }  // Track verification status // Token for email verification
});

const Admin = mongoose.model('admin', adminSchema);
module.exports = Admin;
