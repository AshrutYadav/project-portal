const express = require("express");
const router = express.Router();
const { getMessagesByProject } = require("../controllers/messageController");

router.get("/:projectId", getMessagesByProject);

module.exports = router;