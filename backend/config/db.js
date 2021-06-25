const mongoose = require('mongoose');
require('dotenv').config();
const db = process.env.MONGO_URI; 

const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        console.log("MongoDB Connected.");
    }
    catch(err) {
        console.error("MongoDB Err - " + err.message);
        process.exit(1); //Exit process with fail
    }
}

module.exports = connectDB;