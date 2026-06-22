// routes/notificationRoutes.js
import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import Notification from "../models/notificationModel.js";

const router = express.Router();

// Get user notifications
router.get("/notifications", requireSignIn, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10); // You can paginate or adjust the limit as needed

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
    });
  }
});

export default router;
