import Goal from "../models/goalModel.js";

export const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, autoSavePercentage } = req.body;
    const userId = req.user._id;

    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({ success: false, message: "Name, targetAmount, and deadline are required" });
    }

    const newGoal = new Goal({ userId, name, targetAmount, savedAmount: 0, deadline, autoSavePercentage });
    await newGoal.save();

    res.status(201).json({ success: true, message: "Goal created successfully", goal: newGoal });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating goal", error: error.message });
  }
};

export const getGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const goals = await Goal.find({ userId });

    const goalsWithProgress = goals.map((goal) => {
      const obj = goal.toObject();
      obj.progressPercentage =
        goal.targetAmount > 0
          ? Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100)
          : 0;
      return obj;
    });

    res.status(200).json({ success: true, goals: goalsWithProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching goals", error: error.message });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, autoSavePercentage } = req.body;
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, targetAmount, deadline, autoSavePercentage },
      { new: true }
    );

    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

    const result = goal.toObject();
    result.progressPercentage =
      goal.targetAmount > 0
        ? Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100)
        : 0;

    res.status(200).json({ success: true, message: "Goal updated successfully", goal: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating goal", error: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
    res.status(200).json({ success: true, message: "Goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting goal", error: error.message });
  }
};
