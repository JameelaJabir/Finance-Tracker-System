import express from "express";
import {
  getAdminDashboard,
  getUserDashboard,
} from "../controllers/dashboardController.js";
import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Middleware to check if the user is signed in
router.use(requireSignIn);

// Admin Dashboard Route
router.get("/admin", isAdmin, getAdminDashboard); // Admin only endpoint

// Regular User Dashboard Route
router.get("/user", getUserDashboard); // Regular user endpoint

export default router;
