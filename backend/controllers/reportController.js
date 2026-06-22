import Transaction from "../models/transactionModel.js";
import moment from "moment"; // For date manipulation

// 1. Generate report for spending trends over time
export const generateSpendingReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    let filter = { userId };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Fetch all transactions for the given time range (expenses only)
    const transactions = await Transaction.find({
      ...filter,
      type: "expense",
    }).sort({ date: 1 });

    // Group the transactions by month
    const spendingTrends = {};

    transactions.forEach((transaction) => {
      const month = moment(transaction.date).format("MMMM YYYY");
      if (!spendingTrends[month]) {
        spendingTrends[month] = 0;
      }
      spendingTrends[month] += transaction.amount;
    });

    res.status(200).json({
      success: true,
      report: spendingTrends,
    });
  } catch (error) {
    console.error("Error generating spending report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating report", error });
  }
};

// 2. Generate report for income vs. expenses
export const incomeVsExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    let filter = { userId };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Fetch all transactions for the given time range (both income and expense)
    const transactions = await Transaction.find({
      ...filter,
    });

    // Sum up the income and expense amounts
    let incomeTotal = 0;
    let expenseTotal = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        incomeTotal += transaction.amount;
      } else if (transaction.type === "expense") {
        expenseTotal += transaction.amount;
      }
    });

    res.status(200).json({
      success: true,
      report: {
        income: incomeTotal,
        expense: expenseTotal,
      },
    });
  } catch (error) {
    console.error("Error generating income vs expense report:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating report", error });
  }
};

// 3. Generate filtered report based on time period, category, or tags
export const filteredReport = async (req, res) => {
  try {
    const { startDate, endDate, category, tags } = req.query;
    const userId = req.user._id;

    let filter = { userId };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (category) {
      filter.category = category;
    }

    if (tags) {
      filter.tags = { $in: tags.split(",") };
    }

    // Fetch the filtered transactions based on the query parameters
    const transactions = await Transaction.find(filter);

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Error generating filtered report:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error generating filtered report",
        error,
      });
  }
};
