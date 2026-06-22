import cron from "node-cron";
import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import Notification from "../models/notificationModel.js";
import nodemailer from "nodemailer";

// Set up a cron job to check for alerts every day at midnight (you can adjust as needed)
cron.schedule("0 0 * * *", async () => {
    console.log("Running cron job to check for notifications...");
  // Fetch all users
  const users = await User.find();

  // Loop through users to check for conditions
  users.forEach(async (user) => {
    // Check for unusual spending patterns
    await checkSpendingPattern(user);

    // Check for bill payment reminders
    await checkBillPayments(user);

    // Check for upcoming financial goals
    await checkFinancialGoals(user);
  });
});

// Check for unusual spending patterns (e.g., transactions exceeding a set threshold)
const checkSpendingPattern = async (user) => {
  const threshold = 1000; // Example threshold for unusual spending
  const transactions = await Transaction.find({ userId: user._id });

  let totalSpending = 0;
  transactions.forEach((transaction) => {
    if (transaction.type === "expense") {
      totalSpending += transaction.amount;
    }
  });

  if (totalSpending > threshold) {
    const message = `Unusual spending alert: You've spent more than $${threshold} this month. Please review your expenses.`;
    await createNotification(user, message, "spending-alert");
    sendEmail(user, message); // Optional: send an email as well
  }
};

// Check for bill payments due soon
const checkBillPayments = async (user) => {
  const currentDate = new Date();
  const bills = await Bill.find({
    userId: user._id,
    dueDate: { $gte: currentDate },
  });

  bills.forEach(async (bill) => {
    const dueIn = Math.floor(
      (new Date(bill.dueDate) - currentDate) / (1000 * 3600 * 24)
    ); // days remaining

    if (dueIn <= 3) {
      // If the bill is due within the next 3 days
      const message = `Reminder: Your bill for ${bill.name} is due in ${dueIn} days.`;
      await createNotification(user, message, "bill-reminder");
      sendEmail(user, message); // Optional: send an email reminder
    }
  });
};

// Check for upcoming financial goals
const checkFinancialGoals = async (user) => {
  const goals = await FinancialGoal.find({
    userId: user._id,
    targetDate: { $gte: new Date() },
  });

  goals.forEach(async (goal) => {
    const remainingDays = Math.floor(
      (new Date(goal.targetDate) - new Date()) / (1000 * 3600 * 24)
    );

    if (remainingDays <= 7) {
      // If the goal is due within the next week
      const message = `Reminder: Your goal of saving $${goal.amount} is due in ${remainingDays} days.`;
      await createNotification(user, message, "goal-reminder");
      sendEmail(user, message); // Optional: send an email reminder
    }
  });
};

// Create a notification in the database
const createNotification = async (user, message, type) => {
  const notification = new Notification({
    userId: user._id,
    message,
    type,
  });

  await notification.save();
};

// Send an email notification (optional)
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
    subject: "Financial Notification",
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};

export default cron;
