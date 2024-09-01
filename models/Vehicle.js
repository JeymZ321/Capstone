const mongoose = require('mongoose');

const vechicleSchema = new mongoose.Schema({

    CustomerId: {type: Number, required: true, trim: true},

    Brand: { type: String, required: true, trim: true },
    YearModel: { type: Number, required: true, trim: true },
    Color: { type: String, required: true, trim: true },
    PlateNumber: { type: String, required: true, trim: true },
    CarBodyPanel: { type: String, required: true, trim: true },
    CarFunctionality: { type: String, required: true, trim: true }
});

const vechicle = mongoose.model('Vechicle', vechicleSchema);

module.exports = vechicle;