const mongoose = require('mongoose');
const CustomerSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },  // Ensure email is unique
    iv: { type: String, required: true },
    key: { type: String, required: true }
});

const Customer = mongoose.model('customer', CustomerSchema);
module.exports = Customer;




/*const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({

    Name: {
        type: String,
        required: true,
        trim: true
    },
    Address: {
        type: String,
        required: true,
        trim: true
    },
    ContactNumber: {    
        type: String, 
        required: true,
        trim: true
    },
    Email: {
        type: String,
        required: true,
        trim: true
    },
    DateEntry: {      
        type: String,
        required: true,
        trim: true  
    },
    DateRelease: {
        type: String,
        required: true, 
        trim: true
    },
    EstimateControl: {
        type: Number,
        required: true,
        trim: true      
    },   
    VehicleId: {      
        type: Number,
        required: true,
        trim: true              

    }
}, {

    timestamps: true
}); 

const customer = mongoose.model('Customer', customerSchema);

module.exports = customer;*/