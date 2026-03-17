const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

// PATCH /admin/promote/:collegeId
router.patch("/promote/:collegeId", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { collegeId } = req.params;
        const user = await User.findOneAndUpdate(
            { collegeId: collegeId.toUpperCase() },
            { isAdmin: true },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User promoted to admin successfully", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /admin/list
router.get("/list", authMiddleware, async (req, res) => {
    try {
        const admins = await User.find({ isAdmin: true }).select("collegeId name createdAt");
        res.json(admins);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// PATCH /admin/revoke/:collegeId
router.patch("/revoke/:collegeId", authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const { collegeId } = req.params;

        // Prevent revoking the root fallback explicitly if desired, but here we just revoke.
        const user = await User.findOneAndUpdate(
            { collegeId: collegeId.toUpperCase() },
            { isAdmin: false },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User revoked from admin status.", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
