const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    brandModel: { type: String, required: true },
    color: { type: String, required: true },
    plateNumber: { type: String, required: true, unique: true },
    yearModel: { type: String, required: true },
    transmission: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
module.exports = Vehicle;
