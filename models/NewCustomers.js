// models/NewCustomers.js
const mongoose = require('mongoose');

// Define the schema for customers
const NewCustomersSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    vehicle: { type: String, required: true },
    checkInTime: { type: Date, required: true },
    carFunctionality: { type: String, enum: ['yes', 'no'], required: true },
    services: { type: String },
    vehicleImage: { type: String },
    status: { type: String, default: 'accept' }
}, { timestamps: true });

const NewCustomers = mongoose.model('NewCustomers', NewCustomersSchema);

module.exports = NewCustomers;
