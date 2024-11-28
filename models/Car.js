const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
});

const Car = mongoose.model('Car', CarSchema);
module.exports = Car;
