const express = require("express");
const router = express.Router();
const GeneralMessage = require("../models/GeneralMessage");

router.get("/", async (req, res) => {
    try {
        const messages = await GeneralMessage.find().sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching general messages", error: error.message });
    }
});

module.exports = router;
