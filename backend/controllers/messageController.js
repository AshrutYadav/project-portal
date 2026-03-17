const Message = require("../models/Message");

exports.getMessagesByProject = async (req, res) => {
  try {
    const messages = await Message.find({
      projectId: req.params.projectId,
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};