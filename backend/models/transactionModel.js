import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  tags: [String], // Custom labels like #vacation, #work
  date: {
    type: Date,
    default: Date.now,
  },
  // Recurring Transaction Fields
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrencePattern: {
    type: String,
    enum: ["daily", "weekly", "monthly", "none"],
    default: "none",
  },
  endDate: { type: Date }, // Optional end date for recurring transactions
});

export default mongoose.model("Transaction", transactionSchema);
