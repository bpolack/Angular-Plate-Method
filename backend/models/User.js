const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { 
        type: String,
        required: true
    },
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    userGroup: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'userGroup',
		required: false,
		index: true
	},
    dateMod: {
        type: Date,
        required: true,
        default: Date.now
    },
    dateCreate: {
        type: Date,
        required: true,
        default: Date.now
    }
});

module.exports = User = mongoose.model('user', UserSchema);