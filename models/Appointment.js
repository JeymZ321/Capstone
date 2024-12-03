const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    email: { type: String, trim: true },
    phonenumber: { type: String },
    city: { type: String },
    platenum: { type: String },
    vehicle: { type: String },
    carfunc: { type: String },
    datetime: { type: String, unique: true },
    date: { type: String },                  // Date only (e.g., "2024-12-01")
    time: { type: String },                  // Time only (e.g., "10:00 AM")
    suggestions: { type: String },
    //slot: { type: String },
    preferredMechanic:{ type: String },
    status: { 
        type: String, 
        default: 'pending',              
        enum: ['pending', 'accept', 'archived']
    },
    selectedServices: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
        }
    ]
}, {
    timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;