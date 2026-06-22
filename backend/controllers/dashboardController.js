import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import Budget from "../models/budgetModel.js";
import Goal from "../models/goalModel.js";

// Admin Dashboard - Overview of all users, system activity, and financial summaries
export const getAdminDashboard = async (req, res) => {
  try {
    // Get the total number of users
    const totalUsers = await User.countDocuments();

    // Get the total number of transactions (system activity)
    const totalTransactions = await Transaction.countDocuments();

    // Get total income and expense (financial summary)
    const totalIncome = await Transaction.aggregate([
      { $match: { type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpense = await Transaction.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Return the data in response
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalTransactions,
        totalIncome: totalIncome[0]?.total || 0,
        totalExpense: totalExpense[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching admin dashboard data" });
  }
};

// Regular User Dashboard - Personalized summary of transactions, budgets, and goals
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get the user's transactions (both income and expenses)
    const transactions = await Transaction.find({ userId });

    // Get the user's budgets
    const budgets = await Budget.find({ userId });

    // Get the user's goals
    const goals = await Goal.find({ userId });

    // Calculate the user's total income and expenses
    const incomeTotal = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const expenseTotal = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    // Return the personalized dashboard summary
    res.status(200).json({
      success: true,
      data: {
        incomeTotal,
        expenseTotal,
        budgets,
        goals,
      },
    });
  } catch (error) {
    console.error("Error fetching user dashboard data:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching user dashboard data" });
  }
};
