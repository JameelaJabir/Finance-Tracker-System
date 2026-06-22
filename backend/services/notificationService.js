import cron from "node-cron";
import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import Goal from "../models/goalModel.js";
import Notification from "../models/notificationModel.js";
import nodemailer from "nodemailer";

cron.schedule("0 0 * * *", async () => {
  console.log("Running cron job to check for notifications...");
  try {
    const users = await User.find();
    for (const user of users) {
      await checkSpendingPattern(user);
      await checkUpcomingRecurringTransactions(user);
      await checkFinancialGoals(user);
    }
  } catch (error) {
    console.error("Error in notification cron job:", error);
  }
});

const checkSpendingPattern = async (user) => {
  const threshold = 1000;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const transactions = await Transaction.find({
    userId: user._id,
    type: "expense",
    date: { $gte: startOfMonth },
  });

  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);

  if (totalSpending > threshold) {
    const message = `Unusual spending alert: You've spent $${totalSpending.toFixed(2)} this month, exceeding the $${threshold} threshold. Please review your expenses.`;
    await createNotification(user, message, "spending-alert");
    sendEmail(user, message);
  }
};

const checkUpcomingRecurringTransactions = async (user) => {
  const now = new Date();
  const recurringTransactions = await Transaction.find({
    userId: user._id,
    isRecurring: true,
    $or: [{ endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } }],
  });

  for (const transaction of recurringTransactions) {
    const message = `Reminder: Recurring ${transaction.type} of $${transaction.amount} for "${transaction.category}" (${transaction.recurrencePattern}) is active.`;
    await createNotification(user, message, "bill-reminder");
    sendEmail(user, message);
  }
};

const checkFinancialGoals = async (user) => {
  const now = new Date();
  const goals = await Goal.find({
    userId: user._id,
    deadline: { $gte: now },
  });

  for (const goal of goals) {
    const remainingDays = Math.floor(
      (new Date(goal.deadline) - now) / (1000 * 3600 * 24)
    );

    if (remainingDays <= 7) {
      const remaining = goal.targetAmount - goal.savedAmount;
      const message = `Reminder: Your savings goal "${goal.name}" is due in ${remainingDays} day(s). You still need $${remaining.toFixed(2)} to reach your target of $${goal.targetAmount}.`;
      await createNotification(user, message, "goal-reminder");
      sendEmail(user, message);
    }
  }
};

const createNotification = async (user, message, type) => {
  const notification = new Notification({ userId: user._id, message, type });
  await notification.save();
};

const sendEmail = async (user, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Finance Tracker Notification",
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};

export default cron;
