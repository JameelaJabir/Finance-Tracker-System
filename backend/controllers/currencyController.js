import axios from "axios";
import CurrencyTransaction from "../models/currencyTransactionModel.js";
import dotenv from "dotenv";

dotenv.config();

const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;
const BASE_URL = "https://v6.exchangerate-api.com/v6";

// Fetch real-time exchange rate for a pair of currencies
const getExchangeRate = async (baseCurrency, targetCurrency) => {
  try {
    const url = `${BASE_URL}/${EXCHANGE_API_KEY}/latest/${baseCurrency}`;
    console.log("Fetching exchange rate from:", url);

    const response = await axios.get(url);
    console.log("API Response:", response.data);

    if (response.data.result !== "success") {
      throw new Error("Invalid API response");
    }

    if (!response.data.conversion_rates) {
      throw new Error("Invalid response from exchange rate API");
    }

    const rate = response.data.conversion_rates[targetCurrency];
    if (!rate) {
      throw new Error(`Exchange rate for ${targetCurrency} not found`);
    }

    return rate;
  } catch (error) {
    console.error("Exchange Rate API Error:", error.message);
    throw new Error("Error fetching exchange rate");
  }
};

// Add a new currency transaction (User ID extracted from token)
const addCurrencyTransaction = async (req, res) => {
  const { originalAmount, originalCurrency, convertedCurrency } = req.body;
  const userId = req.user ? req.user._id : null; // Use req.user._id instead of req.userId

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is missing" });
  }

  try {
    const exchangeRate = await getExchangeRate(
      originalCurrency,
      convertedCurrency
    );
    const convertedAmount = originalAmount * exchangeRate;

    const newCurrencyTransaction = new CurrencyTransaction({
      userId,
      originalAmount,
      originalCurrency,
      convertedAmount,
      convertedCurrency,
      exchangeRate,
    });

    await newCurrencyTransaction.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Currency transaction added successfully",
        data: newCurrencyTransaction,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error adding currency transaction",
        error: error.message,
      });
  }
};

// Get all currency transactions for logged-in user
const getUserCurrencyTransactions = async (req, res) => {
  const userId = req.user._id; // This should match the decoded user ID from the JWT

  console.log("User ID:", userId); // Log user ID for debugging

  try {
    const transactions = await CurrencyTransaction.find({ userId });
    console.log("Transactions:", transactions); // Log the result

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching currency transactions",
      error: error.message,
    });
  }
};

export { getExchangeRate,addCurrencyTransaction, getUserCurrencyTransactions };
