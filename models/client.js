const mongoose = require('mongoose');
const ClientSchema = new mongoose.Schema({
    
    email: { type: String, required: true, unique: true },  // Ensure email is unique
   
});

const Client = mongoose.model('client', ClientSchema);
module.exports = Client;