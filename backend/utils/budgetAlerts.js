import cron from "node-cron";
import { checkBudgetAlerts } from "../controllers/budgetController.js";

// Schedule budget alert checks to run daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running scheduled budget alert checks...");
  await checkBudgetAlerts();
});

// Also schedule to run hourly for more timely notifications
cron.schedule("0 * * * *", async () => {
  console.log("Running hourly budget alert checks...");
  await checkBudgetAlerts();
});
