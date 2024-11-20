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
    status: { type: String, default:'pending'}
}, {
    timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;