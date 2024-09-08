const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
    CustomerId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },  // Linking to Appointment
    Brand: { type: String, required: true, trim: true },
    Color: { type: String, required: true, trim: true },
    YearModel: { type: String, required: true, trim: true },
    PlateNumber: { type: String, required: true, trim: true, unique: true },  // Added unique constraint to ensure PlateNumbers are unique
    CarBodyPanel: { 
        type: [String],  // Storing body panels as an array of strings
        validate: {
            validator: function(val) {
                return val.length <= 4;
            },
            message: 'CarBodyPanel exceeds the limit of 4'  // Custom error message for validation
        }
    },
    CarFunctionality: { 
        type: String, 
        required: true, 
        enum: ['functional', 'nonfunctional'],  // Limiting values to two options
        trim: true 
    }
}, {
    timestamps: true  // Automatically adds createdAt and updatedAt timestamps
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema); //D KO ALAM BAKIT GANON UNG LOGIC HAHAA
module.exports = Vehicle;
