import express from "express";
import {
  addCurrencyTransaction,
  getUserCurrencyTransactions,
  getExchangeRate,
} from "../controllers/currencyController.js";
import { requireSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to add a currency transaction
router.post("/create-currency-transactions",requireSignIn, addCurrencyTransaction);

// Route to get all currency transactions of a user
router.get("/get-currency-transactions/:userId",requireSignIn, getUserCurrencyTransactions);

export default router;
