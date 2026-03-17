const Task = require("../models/Task");
const Project = require("../models/Project");

exports.getTasksByProject = async (req, res) => {
  const tasks = await Task.find({ projectId: req.params.projectId });
  res.json(tasks);
};

exports.createTask = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      const project = await Project.findById(req.body.projectId);
      const membership = project?.members.find(m => m.user?.toString() === req.user.userId);
      const isLead = membership?.role === "Lead";

      if (!isLead && (!req.body.assignedTo || !req.body.assignedTo.toUpperCase().startsWith(req.user.collegeId.toUpperCase()))) {
        return res.status(403).json({ message: "Access Denied. You can only assign tasks to yourself." });
      }
    }
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Failed to create task", error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!req.user.isAdmin) {
      const project = await Project.findById(task.projectId);
      const membership = project?.members.find(m => m.user?.toString() === req.user.userId);
      const isLead = membership?.role === "Lead";

      if (!isLead && !task.assignedTo.toUpperCase().startsWith(req.user.collegeId.toUpperCase())) {
        return res.status(403).json({ message: "Access Denied. You can only modify your own tasks." });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Failed to update task", error: err.message });
  }
};