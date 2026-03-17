const express = require("express");
const router = express.Router();
const {
  createSuggestion,
  getSuggestions
} = require("../controllers/suggestionController");

router.post("/", createSuggestion);
router.get("/", getSuggestions);

module.exports = router;