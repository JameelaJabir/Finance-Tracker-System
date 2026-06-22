import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },

  // Goal name (e.g., "Car Savings")
  name: {
    type: String,
    required: true,
  },
  // Target amount
  targetAmount: {
    type: Number,
    required: true,
  },
  // Track saved progress
  savedAmount: {
    type: Number,
    default: 0,
  },
  // Deadline for the goal
  deadline: {
    type: Date,
    required: true,
  },
  // % of income auto-saved
  autoSavePercentage: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Goal = mongoose.model("Goal", goalSchema);
export default Goal;
