import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  categories: {
    type: [String],
    default: [
      "Food", "Transportation", "Entertainment", "Utilities",
      "Healthcare", "Education", "Shopping", "Rent",
      "Salary", "Freelance", "Investment", "Other"
    ],
  },
  categoryLimits: {
    type: Map,
    of: Number,
    default: {},
  },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Settings", settingsSchema);
