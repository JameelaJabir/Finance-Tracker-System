import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetAnalysis,
} from "../controllers/budgetController.js";

const router = express.Router();

// Create a new budget
router.post("/create-budget", requireSignIn, createBudget);

// Get all budgets for the logged-in user
router.get("/get-budget", requireSignIn, getBudgets);

// Get a specific budget by ID
router.get("/get-budget/:id", requireSignIn, getBudgetById);

// Update a budget
router.put("/update-budget/:id", requireSignIn, updateBudget);

// Delete a budget
router.delete("/delete-budget/:id", requireSignIn, deleteBudget);

// Get budget analysis with recommendations
router.get("/analysis-budget/status", requireSignIn, getBudgetAnalysis);

export default router;
