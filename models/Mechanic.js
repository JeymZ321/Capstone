const mongoose = require('mongoose');

const MechanicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    specialization: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: false,
        match: [/^\d{11}$/, 'Phone number must be exactly 11 digits.'], // Optional validation
    },
    availability: {
        type: String,
        enum: ['available', 'unavailable'], // Ensures only valid statuses are used
        default: 'available',
    },
    createdDate: {
        type: Date,
        default: Date.now, // Automatically set the creation date
    },
});

const Mechanic = mongoose.model('Mechanic', MechanicSchema);

module.exports = Mechanic;
