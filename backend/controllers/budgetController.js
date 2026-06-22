import Budget from "../models/budgetModel.js";
import Transaction from "../models/transactionModel.js";
import nodemailer from "nodemailer";
import userModel from "../models/userModel.js";
import { config } from "dotenv";
import mongoose from "mongoose";

// Load environment variables from .env file
config();

// Configure email notifications
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Create a new budget
export const createBudget = async (req, res) => {
  try {
    const {
      category,
      amount,
      period,
      startDate,
      endDate,
      notificationThreshold,
      notes,
    } = req.body;

    // Validate required fields
    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        message: "Category and amount are required",
      });
    }

    // Check if user already has a budget for this category
    const existingBudget = await Budget.findOne({
      userId: req.user._id,
      category: category,
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: new Date() } },
      ],
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: "A budget for this category already exists",
      });
    }

    // Create new budget
    const budget = new Budget({
      userId: req.user._id,
      category,
      amount,
      period,
      startDate,
      endDate,
      notificationThreshold,
      notes,
    });

    // Calculate current spending for this category
    const startDateObj = startDate ? new Date(startDate) : new Date();
    const currentSpending = await calculateCategorySpending(
      req.user._id,
      category,
      startDateObj
    );

    budget.currentSpending = currentSpending;

    // Set initial status based on current spending
    updateBudgetStatus(budget);

    await budget.save();
    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget,
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({
      success: false,
      message: "Error creating budget",
      error: error.message,
    });
  }
};

// Get all budgets for the logged-in user
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });

    // Update current spending for each budget
    for (let budget of budgets) {
      const currentSpending = await calculateCategorySpending(
        req.user._id,
        budget.category,
        budget.startDate
      );

      budget.currentSpending = currentSpending;
      updateBudgetStatus(budget);
      await budget.save();
    }

    res.status(200).json({
      success: true,
      budgets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching budgets",
      error: error.message,
    });
  }
};

// Get a specific budget by ID
export const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Update current spending
    const currentSpending = await calculateCategorySpending(
      req.user._id,
      budget.category,
      budget.startDate
    );

    budget.currentSpending = currentSpending;
    updateBudgetStatus(budget);
    await budget.save();

    res.status(200).json({
      success: true,
      budget,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching budget",
      error: error.message,
    });
  }
};

// Update a budget
export const updateBudget = async (req, res) => {
  try {
    const {
      category,
      amount,
      period,
      startDate,
      endDate,
      notificationThreshold,
      notes,
    } = req.body;

    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Update budget fields
    if (category) budget.category = category;
    if (amount) budget.amount = amount;
    if (period) budget.period = period;
    if (startDate) budget.startDate = startDate;
    if (endDate) budget.endDate = endDate;
    if (notificationThreshold)
      budget.notificationThreshold = notificationThreshold;
    if (notes) budget.notes = notes;

    // Recalculate current spending if category or start date changed
    if (category || startDate) {
      const currentSpending = await calculateCategorySpending(
        req.user._id,
        budget.category,
        budget.startDate
      );
      budget.currentSpending = currentSpending;
    }

    // Update status based on current spending
    updateBudgetStatus(budget);

    await budget.save();
    res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      budget,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating budget",
      error: error.message,
    });
  }
};

// Delete a budget
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting budget",
      error: error.message,
    });
  }
};

// Get budget status and spending analysis
export const getBudgetAnalysis = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });

    const budgetAnalysis = [];

    for (let budget of budgets) {
      // Update current spending
      const currentSpending = await calculateCategorySpending(
        req.user._id,
        budget.category,
        budget.startDate
      );

      budget.currentSpending = currentSpending;
      updateBudgetStatus(budget);
      await budget.save();

      // Get spending trends for recommendations
      const spendingTrend = await getSpendingTrend(
        req.user._id,
        budget.category
      );

      // Generate recommendations
      const recommendations = generateRecommendations(budget, spendingTrend);

      budgetAnalysis.push({
        budget,
        percentageUsed: ((currentSpending / budget.amount) * 100).toFixed(2),
        remaining: budget.amount - currentSpending,
        status: budget.status,
        spendingTrend,
        recommendations,
      });
    }

    res.status(200).json({
      success: true,
      budgetAnalysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting budget analysis",
      error: error.message,
    });
  }
};

// Helper function to calculate spending in a category since startDate
async function calculateCategorySpending(userId, category, startDate) {
  const transactions = await Transaction.find({
    userId,
    category,
    type: "expense",
    date: { $gte: startDate },
  });

  return transactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );
}

// Helper function to update budget status based on current spending
function updateBudgetStatus(budget) {
  const percentageUsed = (budget.currentSpending / budget.amount) * 100;

  if (percentageUsed >= 100) {
    budget.status = "exceeded";
  } else if (percentageUsed >= budget.notificationThreshold) {
    budget.status = "warning";
  } else {
    budget.status = "safe";
  }
}

// Helper function to get spending trend over the last 3 months
async function getSpendingTrend(userId, category) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const transactions = await Transaction.find({
    userId,
    category,
    type: "expense",
    date: { $gte: threeMonthsAgo },
  }).sort({ date: 1 });

  // Group by month
  const monthlySpending = {};

  transactions.forEach((transaction) => {
    const month = new Date(transaction.date).toLocaleString("default", {
      month: "long",
    });
    if (!monthlySpending[month]) {
      monthlySpending[month] = 0;
    }
    monthlySpending[month] += transaction.amount;
  });

  return Object.entries(monthlySpending).map(([month, amount]) => ({
    month,
    amount,
  }));
}

// Helper function to generate budget recommendations
function generateRecommendations(budget, spendingTrend) {
  const recommendations = [];
  const percentageUsed = (budget.currentSpending / budget.amount) * 100;

  // If budget is exceeded
  if (percentageUsed >= 100) {
    recommendations.push(
      `Your ${budget.category} budget is exceeded by $${(
        budget.currentSpending - budget.amount
      ).toFixed(2)}.`
    );
    recommendations.push(
      "Consider increasing your budget or reducing spending in this category."
    );
  }
  // If budget is nearing the threshold
  else if (percentageUsed >= budget.notificationThreshold) {
    const remaining = budget.amount - budget.currentSpending;
    recommendations.push(
      `You've used ${percentageUsed.toFixed(2)}% of your ${
        budget.category
      } budget.`
    );
    recommendations.push(`You have $${remaining.toFixed(2)} remaining.`);
  }

  // Analyze spending trend
  if (spendingTrend.length >= 2) {
    const currentMonth = spendingTrend[spendingTrend.length - 1];
    const previousMonth = spendingTrend[spendingTrend.length - 2];

    if (currentMonth.amount > previousMonth.amount) {
      const increase =
        ((currentMonth.amount - previousMonth.amount) / previousMonth.amount) *
        100;
      recommendations.push(
        `Your spending in ${
          budget.category
        } has increased by ${increase.toFixed(2)}% compared to last month.`
      );
    }
  }

  // Suggest budget adjustment if consistently over/under
  if (spendingTrend.length >= 3) {
    const averageSpending =
      spendingTrend.reduce((total, month) => total + month.amount, 0) /
      spendingTrend.length;

    if (averageSpending > budget.amount * 1.1) {
      recommendations.push(
        `Your average monthly spending ($${averageSpending.toFixed(
          2
        )}) is consistently higher than your budget. Consider increasing your budget to $${(
          averageSpending * 1.1
        ).toFixed(2)}.`
      );
    } else if (averageSpending < budget.amount * 0.7) {
      recommendations.push(
        `Your average monthly spending ($${averageSpending.toFixed(
          2
        )}) is much lower than your budget. You might want to reduce your budget to $${(
          averageSpending * 1.2
        ).toFixed(2)} and allocate funds elsewhere.`
      );
    }
  }

  return recommendations;
}
/////
// Helper function to send email notification
async function sendEmailNotification(userEmail, subject, message) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Budget status update function for real-time notifications
export const sendBudgetNotifications = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });

    for (let budget of budgets) {
      const currentSpending = await calculateCategorySpending(
        req.user._id,
        budget.category,
        budget.startDate
      );
      budget.currentSpending = currentSpending;
      updateBudgetStatus(budget);
      await budget.save();

      // Send email notifications based on status
      if (budget.status === "warning" || budget.status === "exceeded") {
        const user = await userModel.findById(req.user._id);
        const emailMessage = `Your ${budget.category} budget has reached ${
          budget.status
        } status. You have used ${(
          (currentSpending / budget.amount) *
          100
        ).toFixed(2)}% of your budget.`;

        await sendEmailNotification(
          user.email,
          `Budget ${budget.status} Alert: ${budget.category}`,
          emailMessage
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Budget notifications sent successfully.",
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error sending budget notifications",
      error: error.message,
    });
  }
};

// Function to schedule notifications (optional using node-cron or similar)
import cron from "node-cron";

cron.schedule("0 9 * * *", () => {
  console.log("Sending daily budget status notifications...");
  checkBudgetAlerts(); // Send notifications every day at 9 AM
});
///

// Notification system for budget alerts
export const checkBudgetAlerts = async () => {
  try {
    const budgets = await Budget.find({});

    for (let budget of budgets) {
      // Update current spending
      const currentSpending = await calculateCategorySpending(
        budget.userId,
        budget.category,
        budget.startDate
      );

      budget.currentSpending = currentSpending;
      const oldStatus = budget.status;
      updateBudgetStatus(budget);
      await budget.save();

      // If status changed to warning or exceeded, send notification
      if (
        (budget.status === "warning" || budget.status === "exceeded") &&
        oldStatus !== budget.status
      ) {
        // Get user email
        const user = await userModel.findById(budget.userId);
        if (!user) continue;

        // Send email notification
        const percentageUsed = (
          (budget.currentSpending / budget.amount) *
          100
        ).toFixed(2);
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
          )}\nPercentage Used: ${percentageUsed}%\n\nPlease check your Finance Tracker app for more details and recommendations.\n\n- Finance Tracker Team`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.log("Error sending budget alert email:", error);
          else console.log("Budget alert email sent:", info.response);
        });
      }
    }
  } catch (error) {
    console.error("Error checking budget alerts:", error);
  }
};
