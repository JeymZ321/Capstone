const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({

    CustomerId: {type: Number, required: true, trim: true},
    ScheduledId: { type: Number, required: true, trim: true },
    Status: { type: String, required: true, trim: true },
    SelectedServices: { type: String, required: true, trim: true },
    AdditionalInfo: { type: String, required: true, trim: true },
    
}, {
    timestamps: true
});     



const appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = appointment;