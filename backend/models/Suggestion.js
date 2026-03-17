const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema({
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: "Domain" },
  studentName: String,
  title: String,
  description: String,
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending"
  }
});

module.exports = mongoose.model("Suggestion", suggestionSchema);