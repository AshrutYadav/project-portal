const express = require("express");
const router = express.Router();
const {
  getDomains,
  createDomain
} = require("../controllers/domainController");

router.get("/", getDomains);
router.post("/", createDomain);

module.exports = router;