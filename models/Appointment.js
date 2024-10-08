const mongoose = require('mongoose');


const appointmentSchema = new mongoose.Schema({
    //Fullname: { type: String, required: true, trim: true },
    //Address: { type: String, required: true, trim: true },
    //Contact: { type: String, required: true, trim: true },
    //:Email { type: String, required: true, trim: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    iv: { type: String, required: true },
    key: { type: String, required: true },
    datepicker: { type: String, required: false },  // Properly set as Date type
    timepicker: { type: String, required: false, trim: true },
    slots: { type: [String], required: true }  // Storing slots as an array of strings
}, {
    timestamps: true  // Automatically adds createdAt and updatedAt timestamps
});

const Appointment = mongoose.model('Appointment', appointmentSchema);// D KO RIN BAKIT GANON LOGIC HAHAA
module.exports = Appointment;
