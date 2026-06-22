import request from "supertest";
import { expect } from "chai";
import mongoose from "mongoose";
import app from "../server.js";
import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import Budget from "../models/budgetModel.js";
import Goal from "../models/goalModel.js";
import CurrencyTransaction from "../models/currencyTransactionModel.js";
import Notification from "../models/notificationModel.js";

// Unique identifiers for this test run to avoid collisions
const RUN_ID = Date.now();
const TEST_EMAIL = `testuser_${RUN_ID}@financetest.com`;
const TEST_PASSWORD = "TestPass123!";
const TEST_ANSWER = "myTestAnswer";

let authToken;
let userId;
let transactionId;
let budgetId;
let goalId;

// ─── SETUP & TEARDOWN ─────────────────────────────────────────────────────────

before(async function () {
  this.timeout(20000);
  // Wait until MongoDB is connected (connectDB is called in server.js import)
  let waited = 0;
  while (mongoose.connection.readyState !== 1 && waited < 15000) {
    await new Promise((r) => setTimeout(r, 200));
    waited += 200;
  }
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB did not connect within 15 seconds");
  }
});

after(async function () {
  this.timeout(10000);
  if (userId) {
    await Transaction.deleteMany({ userId });
    await Budget.deleteMany({ userId });
    await Goal.deleteMany({ userId });
    await CurrencyTransaction.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
  }
});

// ─── AUTHENTICATION ───────────────────────────────────────────────────────────

describe("1. Authentication", () => {
  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        phone: "0771234567",
        address: "123 Test Street, Colombo",
        answer: TEST_ANSWER,
      });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("success", true);
      expect(res.body.user).to.have.property("email", TEST_EMAIL);
      expect(res.body.user).to.not.have.property("password");
    });

    it("should reject duplicate email registration", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        phone: "0771234567",
        address: "123 Test Street",
        answer: TEST_ANSWER,
      });
      expect(res.body).to.have.property("success", false);
    });

    it("should return an error message when name is missing", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "missing@example.com",
        password: TEST_PASSWORD,
        phone: "0771234567",
        address: "Addr",
        answer: "ans",
      });
      expect(res.body).to.have.property("message");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login and return a JWT token", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property("token");
      authToken = res.body.token;
      userId = res.body.user._id;
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: TEST_EMAIL,
        password: "WrongPassword!",
      });
      expect(res.body).to.have.property("success", false);
    });

    it("should return 404 for an unregistered email", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "ghost@example.com",
        password: TEST_PASSWORD,
      });
      expect(res.status).to.equal(404);
    });

    it("should reject login with missing fields", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({});
      expect(res.status).to.equal(400);
    });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should reset password with correct answer", async () => {
      const res = await request(app).post("/api/v1/auth/forgot-password").send({
        email: TEST_EMAIL,
        answer: TEST_ANSWER,
        newPassword: TEST_PASSWORD,
      });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
    });

    it("should reject reset with wrong security answer", async () => {
      const res = await request(app).post("/api/v1/auth/forgot-password").send({
        email: TEST_EMAIL,
        answer: "totallyWrongAnswer",
        newPassword: "NewPass123!",
      });
      expect(res.status).to.equal(404);
    });
  });

  describe("GET /api/v1/auth/user-auth", () => {
    it("should confirm authentication for a valid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/user-auth")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
    });
  });
});

// ─── SECURITY ─────────────────────────────────────────────────────────────────

describe("2. Security - Unauthorized Access", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/v1/transactions/get-transactions");
    expect(res.status).to.equal(401);
    expect(res.body).to.have.property("success", false);
  });

  it("should return 401 when an invalid token is provided", async () => {
    const res = await request(app)
      .get("/api/v1/transactions/get-transactions")
      .set("Authorization", "invalid.token.here");
    expect(res.status).to.equal(401);
  });

  it("should reject admin dashboard access for a regular user", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/admin")
      .set("Authorization", authToken);
    expect(res.status).to.equal(401);
  });

  it("should reject notification access without a token", async () => {
    const res = await request(app).get("/api/notifications/notifications");
    expect(res.status).to.equal(401);
  });
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

describe("3. Expense & Income Tracking (Transactions)", () => {
  describe("POST /api/v1/transactions/add-transaction", () => {
    it("should create an expense transaction with tags", async () => {
      const res = await request(app)
        .post("/api/v1/transactions/add-transaction")
        .set("Authorization", authToken)
        .send({
          type: "expense",
          amount: 150,
          category: "Food",
          description: "Grocery shopping",
          tags: ["#food", "#essentials"],
        });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("success", true);
      expect(res.body.transaction).to.have.property("category", "Food");
      expect(res.body.transaction.tags).to.include("#food");
      transactionId = res.body.transaction._id;
    });

    it("should create an income transaction", async () => {
      const res = await request(app)
        .post("/api/v1/transactions/add-transaction")
        .set("Authorization", authToken)
        .send({
          type: "income",
          amount: 3000,
          category: "Salary",
          description: "Monthly salary",
        });
      expect(res.status).to.equal(201);
      expect(res.body.transaction).to.have.property("type", "income");
    });

    it("should create a recurring monthly transaction", async () => {
      const res = await request(app)
        .post("/api/v1/transactions/add-transaction")
        .set("Authorization", authToken)
        .send({
          type: "expense",
          amount: 30,
          category: "Utilities",
          description: "Monthly streaming subscription",
          isRecurring: true,
          recurrencePattern: "monthly",
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      expect(res.status).to.equal(201);
      expect(res.body.transaction).to.have.property("isRecurring", true);
      expect(res.body.transaction).to.have.property("recurrencePattern", "monthly");
    });
  });

  describe("GET /api/v1/transactions/get-transactions", () => {
    it("should return all transactions for the logged-in user", async () => {
      const res = await request(app)
        .get("/api/v1/transactions/get-transactions")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.transactions).to.be.an("array");
      expect(res.body.transactions.length).to.be.greaterThan(0);
    });
  });

  describe("PUT /api/v1/transactions/update-transaction/:id", () => {
    it("should update a transaction's amount and description", async () => {
      const res = await request(app)
        .put(`/api/v1/transactions/update-transaction/${transactionId}`)
        .set("Authorization", authToken)
        .send({ amount: 200, description: "Updated grocery shopping" });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.transaction.amount).to.equal(200);
    });
  });

  describe("GET /api/v1/transactions/filter-transactions", () => {
    it("should filter transactions by category", async () => {
      const res = await request(app)
        .get("/api/v1/transactions/filter-transactions?category=Food")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body.transactions).to.be.an("array");
      res.body.transactions.forEach((t) => expect(t.category).to.equal("Food"));
    });

    it("should filter transactions by tag", async () => {
      const res = await request(app)
        .get("/api/v1/transactions/filter-transactions?tags=%23food")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body.transactions).to.be.an("array");
    });

    it("should filter transactions by minimum amount", async () => {
      const res = await request(app)
        .get("/api/v1/transactions/filter-transactions?minAmount=100")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
    });

    it("should sort transactions by amount descending", async () => {
      const res = await request(app)
        .get("/api/v1/transactions/filter-transactions?sortBy=amount")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      const amounts = res.body.transactions.map((t) => t.amount);
      for (let i = 0; i < amounts.length - 1; i++) {
        expect(amounts[i]).to.be.gte(amounts[i + 1]);
      }
    });
  });

  describe("DELETE /api/v1/transactions/delete-transaction/:id", () => {
    it("should delete a transaction by ID", async () => {
      const res = await request(app)
        .delete(`/api/v1/transactions/delete-transaction/${transactionId}`)
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
    });

    it("should return 404 when deleting a non-existent transaction", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/v1/transactions/delete-transaction/${fakeId}`)
        .set("Authorization", authToken);
      expect(res.status).to.equal(404);
    });
  });
});

// ─── BUDGET MANAGEMENT ────────────────────────────────────────────────────────

describe("4. Budget Management", () => {
  describe("POST /api/v1/budgets/create-budget", () => {
    it("should create a monthly budget for a category", async () => {
      const res = await request(app)
        .post("/api/v1/budgets/create-budget")
        .set("Authorization", authToken)
        .send({
          category: "Food",
          amount: 500,
          period: "monthly",
          notificationThreshold: 80,
          notes: "Monthly grocery budget",
        });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("success", true);
      expect(res.body.budget).to.have.property("category", "Food");
      budgetId = res.body.budget._id;
    });

    it("should reject a budget without required fields", async () => {
      const res = await request(app)
        .post("/api/v1/budgets/create-budget")
        .set("Authorization", authToken)
        .send({ period: "monthly" });
      expect(res.status).to.equal(400);
    });

    it("should reject a duplicate active budget for the same category", async () => {
      const res = await request(app)
        .post("/api/v1/budgets/create-budget")
        .set("Authorization", authToken)
        .send({ category: "Food", amount: 300 });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("success", false);
    });
  });

  describe("GET /api/v1/budgets/get-budget", () => {
    it("should return all budgets for the user", async () => {
      const res = await request(app)
        .get("/api/v1/budgets/get-budget")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.budgets).to.be.an("array");
    });
  });

  describe("GET /api/v1/budgets/get-budget/:id", () => {
    it("should return a specific budget by ID", async () => {
      const res = await request(app)
        .get(`/api/v1/budgets/get-budget/${budgetId}`)
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body.budget).to.have.property("_id", budgetId);
    });
  });

  describe("GET /api/v1/budgets/analysis-budget/status", () => {
    it("should return budget analysis with spending trends and recommendations", async () => {
      const res = await request(app)
        .get("/api/v1/budgets/analysis-budget/status")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.budgetAnalysis).to.be.an("array");
      if (res.body.budgetAnalysis.length > 0) {
        const item = res.body.budgetAnalysis[0];
        expect(item).to.have.property("percentageUsed");
        expect(item).to.have.property("remaining");
        expect(item).to.have.property("recommendations");
      }
    });
  });

  describe("PUT /api/v1/budgets/update-budget/:id", () => {
    it("should update the budget amount", async () => {
      const res = await request(app)
        .put(`/api/v1/budgets/update-budget/${budgetId}`)
        .set("Authorization", authToken)
        .send({ amount: 600 });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.budget.amount).to.equal(600);
    });
  });

  describe("DELETE /api/v1/budgets/delete-budget/:id", () => {
    it("should delete a budget by ID", async () => {
      const res = await request(app)
        .delete(`/api/v1/budgets/delete-budget/${budgetId}`)
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
    });
  });
});

// ─── GOALS & SAVINGS ──────────────────────────────────────────────────────────

describe("5. Goals & Savings Tracking", () => {
  describe("POST /api/v1/goals/create-goal", () => {
    it("should create a financial savings goal", async () => {
      const res = await request(app)
        .post("/api/v1/goals/create-goal")
        .set("Authorization", authToken)
        .send({
          name: "Buy a Car",
          targetAmount: 10000,
          deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoSavePercentage: 10,
        });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("success", true);
      expect(res.body.goal).to.have.property("name", "Buy a Car");
      expect(res.body.goal.savedAmount).to.equal(0);
      goalId = res.body.goal._id;
    });

    it("should reject goal creation with missing required fields", async () => {
      const res = await request(app)
        .post("/api/v1/goals/create-goal")
        .set("Authorization", authToken)
        .send({ name: "Incomplete Goal" });
      expect(res.status).to.equal(400);
    });
  });

  describe("GET /api/v1/goals/list-goals", () => {
    it("should return goals with progressPercentage for each goal", async () => {
      const res = await request(app)
        .get("/api/v1/goals/list-goals")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.goals).to.be.an("array");
      expect(res.body.goals.length).to.be.greaterThan(0);
      expect(res.body.goals[0]).to.have.property("progressPercentage");
      expect(res.body.goals[0].progressPercentage).to.equal(0);
    });
  });

  describe("PUT /api/v1/goals/update-goal/:id", () => {
    it("should update a goal's name and target amount", async () => {
      const res = await request(app)
        .put(`/api/v1/goals/update-goal/${goalId}`)
        .set("Authorization", authToken)
        .send({ name: "Buy a Luxury Car", targetAmount: 15000 });
      expect(res.status).to.equal(200);
      expect(res.body.goal).to.have.property("name", "Buy a Luxury Car");
      expect(res.body.goal).to.have.property("progressPercentage");
    });
  });

  describe("DELETE /api/v1/goals/delete-goal/:id", () => {
    it("should delete a goal by ID", async () => {
      const res = await request(app)
        .delete(`/api/v1/goals/delete-goal/${goalId}`)
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
    });
  });
});

// ─── FINANCIAL REPORTS ────────────────────────────────────────────────────────

describe("6. Financial Reports", () => {
  describe("GET /api/v1/reports/spending-trends", () => {
    it("should return spending trends grouped by month", async () => {
      const res = await request(app)
        .get("/api/v1/reports/spending-trends")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property("report");
    });

    it("should support date range filtering", async () => {
      const start = new Date("2025-01-01").toISOString();
      const end = new Date().toISOString();
      const res = await request(app)
        .get(`/api/v1/reports/spending-trends?startDate=${start}&endDate=${end}`)
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
    });
  });

  describe("GET /api/v1/reports/income-vs-expenses", () => {
    it("should return total income and expense summary", async () => {
      const res = await request(app)
        .get("/api/v1/reports/income-vs-expenses")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.report).to.have.property("income");
      expect(res.body.report).to.have.property("expense");
      expect(res.body.report.income).to.be.a("number");
      expect(res.body.report.expense).to.be.a("number");
    });
  });

  describe("GET /api/v1/reports/filtered-report", () => {
    it("should return transactions filtered by category", async () => {
      const res = await request(app)
        .get("/api/v1/reports/filtered-report?category=Salary")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.transactions).to.be.an("array");
    });

    it("should filter by date range", async () => {
      const start = new Date("2025-01-01").toISOString();
      const end = new Date().toISOString();
      const res = await request(app)
        .get(`/api/v1/reports/filtered-report?startDate=${start}&endDate=${end}`)
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
    });

    it("should filter by tags", async () => {
      const res = await request(app)
        .get("/api/v1/reports/filtered-report?tags=%23essentials")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
    });
  });
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

describe("7. Role-Based Dashboard", () => {
  describe("GET /api/v1/dashboard/user", () => {
    it("should return personalized dashboard with income, expenses, budgets, goals", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/user")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.have.property("incomeTotal");
      expect(res.body.data).to.have.property("expenseTotal");
      expect(res.body.data).to.have.property("budgets");
      expect(res.body.data).to.have.property("goals");
      expect(res.body.data.incomeTotal).to.be.a("number");
    });
  });
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

describe("8. Notifications & Alerts", () => {
  describe("GET /api/notifications/notifications", () => {
    it("should return user notifications array", async () => {
      const res = await request(app)
        .get("/api/notifications/notifications")
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.notifications).to.be.an("array");
    });
  });
});

// ─── MULTI-CURRENCY ───────────────────────────────────────────────────────────

describe("9. Multi-Currency Support", () => {
  describe("POST /api/v1/currency/create-currency-transactions", () => {
    it("should convert currency and save the transaction", async () => {
      const res = await request(app)
        .post("/api/v1/currency/create-currency-transactions")
        .set("Authorization", authToken)
        .send({
          originalAmount: 100,
          originalCurrency: "USD",
          convertedCurrency: "LKR",
        });
      // May fail if exchange API key is not set; just check structure
      if (res.status === 201) {
        expect(res.body).to.have.property("success", true);
        expect(res.body.data).to.have.property("convertedAmount");
        expect(res.body.data).to.have.property("exchangeRate");
      } else {
        expect(res.status).to.equal(500);
        expect(res.body).to.have.property("success", false);
      }
    });
  });

  describe("GET /api/v1/currency/get-currency-transactions/:userId", () => {
    it("should return currency transaction history for the user", async () => {
      const res = await request(app)
        .get(`/api/v1/currency/get-currency-transactions/${userId}`)
        .set("Authorization", authToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.be.an("array");
    });
  });
});

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

describe("10. User Profile Management", () => {
  describe("PUT /api/v1/auth/update-profile", () => {
    it("should update user name and phone", async () => {
      const res = await request(app)
        .put("/api/v1/auth/update-profile")
        .set("Authorization", authToken)
        .send({ name: "Updated Test User", phone: "0779876543" });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
    });

    it("should reject a password update shorter than 6 characters", async () => {
      const res = await request(app)
        .put("/api/v1/auth/update-profile")
        .set("Authorization", authToken)
        .send({ password: "123" });
      expect(res.status).to.equal(400);
    });
  });
});
