const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    collegeId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true }, // hashed
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
