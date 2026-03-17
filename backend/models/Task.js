const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  title: { type: String, required: true },
  assignedTo: String,
  deadline: Date,
  status: {
    type: String,
    enum: ["Todo", "InProgress", "Done"],
    default: "Todo"
  }
});

module.exports = mongoose.model("Task", taskSchema);