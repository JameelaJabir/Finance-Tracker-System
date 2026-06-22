import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  filterTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

// 📌 Transaction Routes
// Add a new transaction (POST)
router.post("/add-transaction", requireSignIn, createTransaction);

// Get all transactions for the logged-in user (GET)
router.get("/get-transactions", requireSignIn, getTransactions);

// Update a transaction (PUT)
router.put("/update-transaction/:id", requireSignIn, updateTransaction);

// Delete a transaction (DELETE)
router.delete("/delete-transaction/:id", requireSignIn, deleteTransaction);

// Filter transactions by category, tags, or amount (GET)
router.get("/filter-transactions", requireSignIn, filterTransactions);

export default router;
