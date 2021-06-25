const mongoose = require('mongoose');

const PortionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    percent: {
        type: Number,
        required: true
    }
});

const MealSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user',
		required: true,
		index: true
	},
    mealTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    desc: {
        type: String
    },
    plateSize: {
        type: String,
        required: true
    },
    portions: [PortionSchema]
});
MealSchema.index({ type: 'text', desc: 'text', plateSize: 'text' });

module.exports = Meal = mongoose.model('meal', MealSchema);