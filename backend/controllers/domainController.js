const Domain = require("../models/Domain");

exports.getDomains = async (req, res) => {
  const domains = await Domain.find();
  res.json(domains);
};

exports.createDomain = async (req, res) => {
  const domain = new Domain(req.body);
  await domain.save();
  res.status(201).json(domain);
};