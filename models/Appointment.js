const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    email: { type: String, required: true, trim: true }, // Replaced username
    phonenumber: { type: String, required: true },
    city: { type: String, required: true },
    platenum: { type: String, required: true },
    vehicle: { type: String, required: true },
    carfunc: { type: String, required: true }, // 'functional' or 'nonfunctional'
    datepicker: { type: String, required: true }, // String to hold selected date
    timepicker: { type: String, required: true }, // String to hold selected time
    panels: { type: [String], required: false },  // Array of selected panels
    slots: { type: [String], required: true }  // Array of selected slots
}, {
    timestamps: true  // Automatically adds createdAt and updatedAt timestamps
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
