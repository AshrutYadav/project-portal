const Suggestion = require("../models/Suggestion");

exports.createSuggestion = async (req, res) => {
  const suggestion = new Suggestion(req.body);
  await suggestion.save();
  res.status(201).json(suggestion);
};

exports.getSuggestions = async (req, res) => {
  const suggestions = await Suggestion.find();
  res.json(suggestions);
};