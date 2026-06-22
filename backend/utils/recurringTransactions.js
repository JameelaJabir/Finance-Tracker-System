import cron from "node-cron";
import Transaction from "../models/transactionModel.js";
import nodemailer from "nodemailer";
import userModel from "../models/userModel.js";

// Configure email notifications
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Scheduled Task: Check for upcoming recurring transactions every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Checking for upcoming recurring transactions...");

  const today = new Date();
  const transactions = await Transaction.find({ isRecurring: true });

  transactions.forEach(async (transaction) => {
    const { recurrencePattern, endDate, userId } = transaction;

    // Stop processing if end date has passed
    if (endDate && new Date(endDate) < today) return;

    let nextTransactionDate = new Date(transaction.date);

    // Determine the next transaction date
    switch (recurrencePattern) {
      case "daily":
        nextTransactionDate.setDate(today.getDate() + 1);
        break;
      case "weekly":
        nextTransactionDate.setDate(today.getDate() + 7);
        break;
      case "monthly":
        nextTransactionDate.setMonth(today.getMonth() + 1);
        break;
    }

    // Create a new recurring transaction
    const newTransaction = new Transaction({
      ...transaction._doc,
      _id: undefined, // Remove original transaction ID
      date: nextTransactionDate,
    });

    await newTransaction.save();
    console.log("Recurring transaction created:", newTransaction);

    // Send email notification to the user
    const user = await userModel.findById(userId);
    if (user) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Upcoming Recurring Transaction",
        text: `Hello ${
          user.name
        },\n\nA recurring transaction is due on ${nextTransactionDate.toDateString()}.\nCategory: ${
          transaction.category
        }\nAmount: $${transaction.amount}\n\n- Finance Tracker Team`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log("Error sending email:", error);
        else console.log("Email sent:", info.response);
      });
    }
  });
});
