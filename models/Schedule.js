const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({

    CustomerId: {

        type: Number,
        required: true,
        trim: true

    },

    ScheduledId: {

        type: Number,
        required: true,

    },

    Status: {

        type: String,
        required: true,

    },

    SelectedServices: {

        type: String,
        required: true,

    },

    AdditionalInfo: {

        type: String,
        required: true,

    },
    
    VehicleId: {

        type: Number,
        required: true,

    }

}, {

    timestamps: true
});

const schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = schedule;