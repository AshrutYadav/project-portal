const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// POST /auth/login
router.post("/login", async (req, res) => {
    try {
        const { collegeId, password } = req.body;

        if (!collegeId || !password) {
            return res.status(400).json({ message: "Please enter all fields" });
        }

        let user = await User.findOne({ collegeId });

        // Admin dynamic provisioning logic
        if (collegeId === "BT25CSH022" && !user) {
            if (password === "Ashr0186") {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                user = new User({
                    collegeId,
                    name: "Root Admin",
                    password: hashedPassword,
                    isAdmin: true
                });
                await user.save();
            } else {
                return res.status(401).json({ message: "Invalid credentials" });
            }
        }

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Create JWT Payload
        const payload = {
            userId: user._id,
            collegeId: user.collegeId,
            isAdmin: user.isAdmin
        };

        // Sign Token
        jwt.sign(
            payload,
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "7d" },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        collegeId: user.collegeId,
                        isAdmin: user.isAdmin
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
