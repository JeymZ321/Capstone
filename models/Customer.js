const mongoose = require('mongoose');

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

module.exports = customer;