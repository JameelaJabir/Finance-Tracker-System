import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import "./utils/recurringTransactions.js"; // Import the cron job
import budgetRoutes from "./routes/budgetRoutes.js";
import "./utils/budgetAlerts.js"; // Import budget alerts scheduler
import goalRoutes from "./routes/goalRoutes.js";
import currencyTransactionRoutes from './routes/currencyTransactionRoutes.js';  // Import the new currency transaction routes
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationService from "./services/notificationService.js"; // Import your notification service
import notificationRoutes from "./routes/notificationRoutes.js"; // Your notification routes (example)

//configure env
dotenv.config();
console.log("EXCHANGE_API_KEY:", process.env.EXCHANGE_API_KEY);
//database config
connectDB();

//rest object
const app = express();

//middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/budgets", budgetRoutes);
app.use("/api/v1/goals", goalRoutes); 
app.use('/api/v1/currency', currencyTransactionRoutes); // Use the currency transaction routes
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);

// Start cron job (this will automatically start when your app runs)
notificationService; // This starts the cron job

//rest api
app.get("/", (req, res) => {
  res.send(`<h1>Welcome to Authentication Demo</h1>`);
});

//port
const PORT = process.env.PORT || 8086;

//run listen
app.listen(PORT, () => {
  console.log(
    `Server is up and running on ${process.env.DEV_MODE} mode on port number: ${PORT}`
      .bgCyan.white
  );
});
