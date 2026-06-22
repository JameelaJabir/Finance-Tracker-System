import Goal from "../models/goalModel.js";

// Create a new financial goal
export const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, autoSavePercentage } = req.body;

    // Extract userId from req.user (set by requireSignIn middleware)
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const newGoal = new Goal({
      userId,
      name,
      targetAmount,
      savedAmount: 0, // Default saved amount
      deadline,
      autoSavePercentage,
    });

    await newGoal.save();

    res.status(201).json({ message: "Goal created successfully", goal: newGoal });
  } catch (error) {
    res.status(500).json({ message: "Error creating goal", error: error.message });
  }
};

// Retrieve all goals for a user
export const getGoals = async (req, res) => {
  try {
    const userId = req.user._id; // Extract userId from auth middleware

    console.log("Fetching goals for user:", userId); // Debugging line

    const goals = await Goal.find({ userId });

    if (goals.length === 0) {
      return res.status(200).json({ message: "No goals found for this user.", goals: [] });
    }

    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ message: "Error fetching goals", error: error.message });
  }
};

// Update a goal
export const updateGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, autoSavePercentage } = req.body;
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { name, targetAmount, deadline, autoSavePercentage },
      { new: true }
    );

    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.status(200).json({ message: "Goal updated successfully", goal });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating goal", error: error.message });
  }
};

// Delete a goal
export const deleteGoal = async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting goal", error: error.message });
  }
};
