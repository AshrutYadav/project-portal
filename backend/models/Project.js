const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: "Domain" },
  deadline: Date,
  startDate: Date,
  status: {
    type: String,
    enum: ["Proposed", "Active", "Completed", "Archived"],
    default: "Proposed"
  },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["Lead", "Member"], default: "Member" }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Project", projectSchema);