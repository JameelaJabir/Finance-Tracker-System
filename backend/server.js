import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import "./utils/recurringTransactions.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import "./utils/budgetAlerts.js";
import goalRoutes from "./routes/goalRoutes.js";
import currencyTransactionRoutes from "./routes/currencyTransactionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationService from "./services/notificationService.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";

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
app.use("/api/", apiLimiter);
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/budgets", budgetRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/currency", currencyTransactionRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/admin", adminRoutes);
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
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(
      `Server is up and running on ${process.env.DEV_MODE} mode on port number: ${PORT}`
        .bgCyan.white
    );
  });
}

export default app;
