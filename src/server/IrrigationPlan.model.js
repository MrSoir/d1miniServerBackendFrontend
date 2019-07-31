const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let IrrigationPlan = new Schema({
    plan: {
        type: String
    }
});

module.exports = mongoose.model('IrrigationPlan', IrrigationPlan);
