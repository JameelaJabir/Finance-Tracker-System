import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import Notification from "../models/notificationModel.js";

const router = express.Router();

// Get user notifications
router.get("/get-notifications", requireSignIn, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
});

// Mark a single notification as read
router.put("/mark-read/:id", requireSignIn, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Error marking notification" });
  }
});

// Mark all notifications as read
router.put("/mark-all-read", requireSignIn, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { read: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Error marking notifications" });
  }
});

// Delete a notification
router.delete("/delete-notification/:id", requireSignIn, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Error deleting notification" });
  }
});

export default router;
