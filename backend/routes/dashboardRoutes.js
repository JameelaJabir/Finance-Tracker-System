import express from "express";
import { getAdminDashboard, getUserDashboard, getHealthScore } from "../controllers/dashboardController.js";
import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireSignIn);

router.get("/admin", isAdmin, getAdminDashboard);
router.get("/user", getUserDashboard);
router.get("/health-score", getHealthScore);

export default router;
