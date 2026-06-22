import mongoose from "mongoose";

// Define the schema for a currency transaction
const currencyTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a User model
    required: true,
  },
  originalAmount: {
    type: Number,
    required: true,
  },
  originalCurrency: {
    type: String,
    required: true,
  },
  convertedAmount: {
    type: Number,
    required: true,
  },
  convertedCurrency: {
    type: String,
    required: true,
  },
  exchangeRate: {
    type: Number,
    required: true,
  },
  transactionDate: {
    type: Date,
    default: Date.now,
  },
});

// Create the model for currency transactions
const CurrencyTransaction = mongoose.model(
  "CurrencyTransaction",
  currencyTransactionSchema
);

export default CurrencyTransaction;
