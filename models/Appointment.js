const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    email: { type: String, trim: true },
    phonenumber: { type: String },
    city: { type: String },
    platenum: { type: String },
    vehicle: { type: String },
    carfunc: { type: String },
    datetime: { type: String, unique: true },
    suggestions: { type: String },
    //slot: { type: String },
    status: { type: String, default:'pending'},
    selectedServices: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            mechanic: { type: String, required: true },
            estimation: { type: String, required: true },
        }
    ]
}, {
    timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;