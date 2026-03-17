const JoinRequest = require("../models/JoinRequest");

exports.createJoinRequest = async (req, res) => {
  const request = new JoinRequest(req.body);
  await request.save();
  res.status(201).json(request);
};

exports.getJoinRequests = async (req, res) => {
  const requests = await JoinRequest.find({
    projectId: req.params.projectId
  });
  res.json(requests);
};