const mongoose = require('mongoose');

const unverifiedAdminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  fullname: String,
  contact: String,
  verificationCode: String, // For storing the verification code
  createdAt: { type: Date, default: Date.now, expires: '24h' } // Automatically deletes after 24 hours
});

const UnverifiedAdmin = mongoose.model('UnverifiedAdmin', unverifiedAdminSchema);
module.exports = UnverifiedAdmin;
