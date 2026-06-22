// routes/goalRoutes.js
import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} from "../controllers/goalController.js";

const router = express.Router();

// Create a new goal
router.post("/create-goal",requireSignIn, createGoal);

// Get all goals for a user
router.get("/list-goals",requireSignIn, getGoals);

// Update an existing goal (e.g., add current savings)
router.put("/update-goal/:id",requireSignIn, updateGoal);

router.delete("/delete-goal/:id", requireSignIn, deleteGoal); // Delete goal

export default router;
