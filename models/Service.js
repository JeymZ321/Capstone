const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'homepage-slider', 'about-us'
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  description: {type: String, required: true}
});

const Service = mongoose.model('Image', ServiceSchema);
module.exports = Service;
