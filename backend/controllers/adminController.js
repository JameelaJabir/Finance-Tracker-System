import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import Budget from "../models/budgetModel.js";
import Goal from "../models/goalModel.js";

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "" } = req.query;
    const filter = search
      ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
      : {};
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password -answer")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.status(200).json({ success: true, total, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, userId: filterUserId } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (filterUserId) filter.userId = filterUserId;

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate("userId", "name email")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({ success: true, total, page: Number(page), transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching transactions", error: error.message });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await Transaction.deleteMany({ userId: id });
    await Budget.deleteMany({ userId: id });
    await Goal.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "User and all related data deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
  }
};
