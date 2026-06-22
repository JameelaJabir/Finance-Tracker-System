import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    period: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      default: "monthly",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    notificationThreshold: {
      type: Number,
      default: 80, // Percentage of budget at which to notify (default 80%)
    },
    notes: {
      type: String,
    },
    // Current spending towards this budget
    currentSpending: {
      type: Number,
      default: 0,
    },
    // Budget status (for quick querying)
    status: {
      type: String,
      enum: ["safe", "warning", "exceeded"],
      default: "safe",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Budget", budgetSchema);
