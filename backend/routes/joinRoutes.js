const express = require("express");
const router = express.Router();
const {
  createJoinRequest,
  getJoinRequests
} = require("../controllers/joinController");

router.post("/", createJoinRequest);
router.get("/:projectId", getJoinRequests);

module.exports = router;