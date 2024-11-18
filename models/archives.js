const mongoose = require('mongoose');

const ArchivedCustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    city: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const ArchivedCustomers = mongoose.model('ArchivedCustomers', ArchivedCustomerSchema);
module.exports = ArchivedCustomers;
