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
    time: { type: String },
    endTime: { type: String },                  
    suggestions: { type: String },
    //slot: { type: String },
    mechanic: { type: String, default: null },
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