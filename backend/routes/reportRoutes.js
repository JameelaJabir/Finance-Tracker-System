import express from "express";
import {
  generateSpendingReport,
  incomeVsExpenseReport,
  filteredReport,
} from "../controllers/reportController.js";
import { requireSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes
router.use(requireSignIn);

// Financial Reports Endpoints
router.get("/spending-trends", generateSpendingReport); // Endpoint to generate spending trends
router.get("/income-vs-expenses", incomeVsExpenseReport); // Endpoint for income vs. expense chart
router.get("/filtered-report", filteredReport); // Endpoint for filtered reports

export default router;
