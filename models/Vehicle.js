const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
    Brand: { type: String, required: true, trim: true },
    Color: { type: String, required: true, trim: true },
    YearModel: { type: String, required: true, trim: true },
    PlateNumber: { type: String, required: true, trim: true, unique: true },  // Added unique constraint to ensure PlateNumbers are unique
    CarBodyPanel: { type: String, required: true, trim: true },  // Storing body panels as a single string
    CarFunctionality: { type: String, required: true, enum: ['functional', 'nonfunctional'], trim: true }
},
 {
    timestamps: true  // Automatically adds createdAt and updatedAt timestamps
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema); //D KO ALAM BAKIT GANON UNG LOGIC HAHAA
module.exports = Vehicle;
