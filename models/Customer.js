const mongoose = require('mongoose');

// Embedded vehicle schema
const VehicleSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    color: { type: String, required: true },
    customColor: { type: String },
    plateNumber: { type: String, required: true, unique: true },
    yearModel: { type: String, required: true },
    transmission: { type: String, required: true },
    imageUrl: { type: String } // Optional: Vehicle image URL
});

// Customer schema
const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phonenumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    city: { type: String },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: true },
    registrationDate: { type: Date, default: Date.now },
    vehicles: [VehicleSchema] // Embed vehicles here
});

const Customer = mongoose.model('Customer', CustomerSchema);
module.exports = Customer;
