const express = require("express");
const router = express.Router();
const {
  getTasksByProject,
  createTask,
  updateTask
} = require("../controllers/taskController");

router.get("/:projectId", getTasksByProject);
router.post("/", createTask);
router.patch("/:id", updateTask);

module.exports = router;