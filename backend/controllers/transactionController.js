import Transaction from "../models/transactionModel.js";
import Budget from "../models/budgetModel.js";
import users from "../models/userModel.js";
import nodemailer from "nodemailer";
import Goal from "../models/goalModel.js";

// Configure email notifications
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const createTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      tags,
      isRecurring,
      recurrencePattern,
      endDate,
    } = req.body;

    const transaction = new Transaction({
      userId: req.user._id,
      type,
      amount,
      category,
      description,
      tags,
      isRecurring,
      recurrencePattern,
      endDate,
    });

    await transaction.save();

    // If this is an expense, update the relevant budget
    if (type === "expense") {
      await updateBudgetAfterTransaction(req.user._id, category, amount);
    }

    // If income, allocate savings automatically
    if (type === "income") {
      const goals = await Goal.find({
        userId: req.user._id,
        autoSavePercentage: { $gt: 0 },
      });

      let totalAllocated = 0;
      for (let goal of goals) {
        let allocation = (goal.autoSavePercentage / 100) * amount;
        goal.savedAmount += allocation;
        totalAllocated += allocation;
        await goal.save();
      }

      // Update user's total savings
      const user = await users.findById(req.user._id);
      user.totalSavings += totalAllocated;
      await user.save();
    }

    res
      .status(201)
      .json({ success: true, message: "Transaction added", transaction });
  } catch (error) {
    console.error("Error creating transaction:", error); // Log the error to the console for debugging
    res
      .status(500)
      .json({
        success: false,
        message: "Error adding transaction",
        error: error.message || error,
      });
  }
};

// Get all transactions for the logged-in user
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({
      date: -1,
    });
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching transactions", error });
  }
};

// Update a transaction
export const updateTransaction = async (req, res) => {
  try {
    // Find the transaction before updating to get the old values
    const oldTransaction = await Transaction.findById(req.params.id);

    if (!oldTransaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    // Adjust the relevant budget for the old transaction (if it was an expense)
    if (oldTransaction.type === "expense") {
      await updateBudgetAfterTransaction(
        req.user._id,
        oldTransaction.category,
        -oldTransaction.amount
      );
    }

    // Update the transaction
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Adjust the relevant budget for the new transaction (if it's an expense)
    if (transaction.type === "expense") {
      await updateBudgetAfterTransaction(
        req.user._id,
        transaction.category,
        transaction.amount
      );
    }

    res
      .status(200)
      .json({ success: true, message: "Transaction updated", transaction });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating transaction", error });
  }
};

// Delete a transaction
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    // If this was an expense, adjust the budget
    if (transaction.type === "expense") {
      await updateBudgetAfterTransaction(
        req.user._id,
        transaction.category,
        -transaction.amount
      );
    }

    // Delete the transaction
    await Transaction.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting transaction", error });
  }
};

// Filter and Sort Transactions
export const filterTransactions = async (req, res) => {
  try {
    const { category, tags, minAmount, maxAmount, sortBy } = req.query;
    let filters = { userId: req.user._id };

    if (category) filters.category = category;
    if (tags) filters.tags = { $in: tags.split(",") };
    if (minAmount || maxAmount)
      filters.amount = { $gte: minAmount || 0, $lte: maxAmount || 999999 };

    // Sorting options (by date or amount)
    let sortOptions = {};
    if (sortBy === "date") sortOptions.date = -1; // Sort by latest transactions
    if (sortBy === "amount") sortOptions.amount = -1; // Sort by highest amount

    const transactions = await Transaction.find(filters).sort(sortOptions);
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error filtering transactions", error });
  }
};

// Search transactions by description or category
export const searchTransactions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Search query is required" });

    const transactions = await Transaction.find({
      userId: req.user._id,
      $or: [
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { tags: { $elemMatch: { $regex: q, $options: "i" } } },
      ],
    }).sort({ date: -1 });

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error searching transactions", error: error.message });
  }
};

// Export transactions as CSV
export const exportTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });

    const header = "Date,Type,Category,Amount,Description,Tags,Recurring\n";
    const rows = transactions.map((t) => {
      const date = new Date(t.date).toLocaleDateString();
      const tags = (t.tags || []).join("|");
      return `${date},${t.type},${t.category},${t.amount},"${t.description || ""}","${tags}",${t.isRecurring}`;
    });

    const csv = header + rows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error exporting transactions", error: error.message });
  }
};

// Helper function to update a budget after a transaction is created, updated, or deleted
async function updateBudgetAfterTransaction(userId, category, amount) {
  try {
    // Find active budget for this category
    const budget = await Budget.findOne({
      userId,
      category,
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: new Date() } },
      ],
    });

    // If there's no budget for this category, just return
    if (!budget) return;

    // Update current spending
    budget.currentSpending += amount;
    if (budget.currentSpending < 0) budget.currentSpending = 0; // Ensure we don't go negative

    // Update status
    const oldStatus = budget.status;
    const percentageUsed = (budget.currentSpending / budget.amount) * 100;

    if (percentageUsed >= 100) {
      budget.status = "exceeded";
    } else if (percentageUsed >= budget.notificationThreshold) {
      budget.status = "warning";
    } else {
      budget.status = "safe";
    }

    await budget.save();

    // Send notification if status changed to warning or exceeded
    if (
      (budget.status === "warning" || budget.status === "exceeded") &&
      oldStatus !== budget.status
    ) {
      // Get user email
      const user = await users.findById(userId);
      if (!user) return;

      // Send email notification
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Budget Alert: ${budget.category} ${
          budget.status === "warning" ? "Nearing Limit" : "Exceeded"
        }`,
        text: `Hello ${user.name},\n\nYour budget for ${budget.category} is ${
          budget.status === "warning" ? "approaching" : "has exceeded"
        } the limit.\n\nCurrent Spending: $${budget.currentSpending.toFixed(
          2
        )}\nBudget Limit: $${budget.amount.toFixed(
          2
        )}\nPercentage Used: ${percentageUsed.toFixed(
          2
        )}%\n\nPlease check your Finance Tracker app for more details.\n\n- Finance Tracker Team`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log("Error sending budget alert email:", error);
        else console.log("Budget alert email sent:", info.response);
      });
    }
  } catch (error) {
    console.error("Error updating budget after transaction:", error);
  }
}
