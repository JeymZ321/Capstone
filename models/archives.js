const mongoose = require('mongoose');

const ArchiveSchema = new mongoose.Schema({
    email: {type: String, required: true},
    datepicker: {type: String, required: true}, 
    timepicker: {type: String},
    slots: [String],
}, { timestamps: true });

const Archive = mongoose.model('Archive', ArchiveSchema);
module.exports = Archive;