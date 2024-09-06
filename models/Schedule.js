const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({

    SelectDate: {type: String, required: true, trim: true},
    SelectTime: { type: String, required: true, trim: true },
    Slots: { type: Number, required: true, trim: true }
    
}, {
    timestamps: true
});

const schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = schedule;