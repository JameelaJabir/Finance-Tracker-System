# Finance Tracker System

A full-stack personal finance management application built with Node.js, Express, MongoDB, and React. 

---

## Features

### Core (Assignment Requirements)
- **User Authentication** — Register, login, JWT-based session, forgot password via security question
- **Transaction Management** — Create, read, update, delete income and expense transactions with categories, tags, and descriptions
- **Recurring Transactions** — Mark transactions as recurring (daily/weekly/monthly) with optional end dates; auto-generated via cron
- **Budget Management** — Set budgets per category and period; real-time tracking of spending against limits; safe/warning/exceeded status
- **Budget Analysis** — Spending trend by month per budget, AI-like recommendations
- **Savings Goals** — Create savings goals with target amounts, deadlines, auto-save percentage, and manual deposits
- **Financial Reports** — Spending trends over time, income vs. expense comparison, category breakdown with charts
- **Currency Converter** — Real-time exchange rates via ExchangeRate-API; full conversion history
- **Notifications** — Budget threshold alerts, goal deadline reminders, recurring transaction notices
- **Admin Dashboard** — System-wide stats, all-user transaction oversight, user management with cascade delete
- **Admin Settings** — Configurable expense categories and per-category monthly spending limits

### Extra Features Added
- **Financial Health Score** — Calculated score (0–100) with grade (Excellent/Good/Fair/Poor) based on income/expense ratio, budget adherence, and goal progress
- **CSV Export** — Download all transactions as a CSV file
- **Rate Limiting** — 200 requests/15 min (API), 20 requests/15 min (auth endpoints)
- **Search & Filter** — Search transactions by description, category, or tags; filter by type and category
- **Spending Analysis per Budget** — Monthly trend chart and recommendations shown per budget
- **Responsive UI** — Mobile-first design with collapsible sidebar on small screens

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js (ES Modules) |
| Database | MongoDB, Mongoose |
| Authentication | JWT (jsonwebtoken), bcrypt |
| Scheduled Tasks | node-cron |
| Testing | Mocha, Chai, Supertest |
| Frontend | React 18, Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| HTTP Client | Axios |
| Toast Notifications | React Hot Toast |

---

## Project Structure

```
Finance-Tracker-System/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Business logic
│   ├── helpers/         # Password hashing utilities
│   ├── middleware/      # Auth middleware, rate limiter
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── services/        # Notification cron service
│   ├── test/            # Mocha integration + unit tests
│   ├── utils/           # Recurring transactions, budget alerts
│   ├── server.js        # Entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/         # Axios instance with auth interceptor
    │   ├── components/  # Shared UI components
    │   ├── context/     # AuthContext (user, token, login, logout)
    │   └── pages/       # Route-level page components
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- ExchangeRate-API key (free tier at [exchangerate-api.com](https://www.exchangerate-api.com))

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=8086
MONGO_URL=mongodb://localhost:27017/finance-tracker
JWT_SECRET=your_super_secret_jwt_key
DEV_MODE=development
EXCHANGE_API_KEY=your_exchangerate_api_key
```

Start the backend:

```bash
npm start          # production
npm run server     # development (nodemon, auto-restart on save)
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:3000
```

The Vite dev server proxies `/api` requests to `http://localhost:8086` automatically.

### First Admin Account

Register normally, then manually set `role: 1` in MongoDB:

```js
// In MongoDB shell or Compass
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: 1 } })
```

---

## Running Tests

```bash
cd backend
npm test
```

Tests use Mocha + Chai + Supertest. They spin up the Express app in-process (no server listen) and connect to MongoDB. A unique test user is created per run and cleaned up after.

**Test coverage:**
- 12 unit tests — `hashPassword`, `comparePassword`, budget status logic, goal progress calculation
- 40+ integration tests — auth, transactions (CRUD, search, tags, recurring), budgets (CRUD, analysis, duplicate check), goals (CRUD, progress), reports, dashboard, notifications, currency, profile

---

## API Reference

All API routes are prefixed with `/api`.

### Authentication — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register new user (name, email, password, phone, address, answer) |
| POST | `/login` | — | Login and receive JWT token |
| POST | `/forgot-password` | — | Reset password using security answer |
| PUT | `/update-profile` | User | Update name, email, phone, address, or password |
| DELETE | `/delete-profile` | User | Delete own account |
| GET | `/list-users` | Admin | List all users |

### Transactions — `/api/v1/transactions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/add-transaction` | User | Create a new transaction |
| GET | `/get-transactions` | User | Get all user transactions |
| PUT | `/update-transaction/:id` | User | Update a transaction |
| DELETE | `/delete-transaction/:id` | User | Delete a transaction |
| GET | `/search?q=` | User | Full-text search (description, category, tags) |
| GET | `/filter-transactions` | User | Filter by category, tags, amount |
| GET | `/export` | User | Download transactions as CSV |

### Budgets — `/api/v1/budgets`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create-budget` | User | Create a budget |
| GET | `/get-budget` | User | Get all budgets with current spending |
| GET | `/get-budget/:id` | User | Get a single budget |
| PUT | `/update-budget/:id` | User | Update a budget |
| DELETE | `/delete-budget/:id` | User | Delete a budget |
| GET | `/analysis-budget/status` | User | Budget analysis with trends and recommendations |

### Goals — `/api/v1/goals`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create-goal` | User | Create a savings goal |
| GET | `/list-goals` | User | List all goals with progress percentage |
| PUT | `/update-goal/:id` | User | Update goal (including savedAmount deposits) |
| DELETE | `/delete-goal/:id` | User | Delete a goal |

### Reports — `/api/v1/reports`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/spending-trends?startDate=&endDate=` | User | Expense totals grouped by month |
| GET | `/income-vs-expenses?startDate=&endDate=` | User | Aggregate income and expense totals |
| GET | `/filtered-report?startDate=&endDate=&category=&tags=` | User | Filtered transaction list |

### Dashboard — `/api/v1/dashboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user` | User | User summary (income, expenses, budgets, goals) |
| GET | `/admin` | Admin | System-wide totals |
| GET | `/health-score` | User | Financial health score and grade |

### Currency — `/api/v1/currency`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create-currency-transactions` | User | Convert currency and save record |
| GET | `/get-currency-transactions/:userId` | User | Get conversion history |

### Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/get-notifications` | User | Get all notifications |
| PUT | `/mark-read/:id` | User | Mark one as read |
| PUT | `/mark-all-read` | User | Mark all as read |
| DELETE | `/delete-notification/:id` | User | Delete a notification |

### Admin — `/api/v1/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | List all users (paginated, searchable) |
| DELETE | `/users/:id` | Admin | Delete user + all their data |
| GET | `/transactions` | Admin | All transactions (paginated, filterable) |
| GET | `/settings` | Admin | Get system settings |
| POST | `/settings/categories` | Admin | Add a category |
| DELETE | `/settings/categories/:category` | Admin | Remove a category |
| PUT | `/settings/category-limits` | Admin | Set per-category spending limits |

---

## Authentication

The backend uses JWT tokens stored without the `Bearer` prefix. The frontend sends them directly in the `Authorization` header:

```
Authorization: <jwt_token>
```

Tokens expire after **7 days**.

---

## Frontend Pages

| Route | Page | Access |
|-------|------|--------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/forgot-password` | Reset Password | Public |
| `/` | Dashboard | User |
| `/transactions` | Transactions | User |
| `/budgets` | Budgets | User |
| `/goals` | Savings Goals | User |
| `/reports` | Reports & Analytics | User |
| `/currency` | Currency Converter | User |
| `/notifications` | Notifications | User |
| `/profile` | Profile Settings | User |
| `/admin` | Admin Dashboard | Admin |
| `/admin/users` | User Management | Admin |
| `/admin/settings` | System Settings | Admin |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port (default: 8086) | No |
| `MONGO_URL` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for signing JWTs | Yes |
| `DEV_MODE` | Environment label (`development`/`production`) | No |
| `EXCHANGE_API_KEY` | ExchangeRate-API key | Yes (for currency) |

---

## Data Models

### User
`name`, `email`, `password` (hashed), `phone`, `address`, `answer` (security question answer), `role` (0=user, 1=admin)

### Transaction
`userId`, `type` (income/expense), `amount`, `category`, `description`, `tags[]`, `date`, `isRecurring`, `recurrencePattern` (daily/weekly/monthly/none), `endDate`

### Budget
`userId`, `category`, `amount`, `period` (monthly/quarterly/yearly), `currentSpending`, `status` (safe/warning/exceeded), `notificationThreshold` (%), `notes`

### Goal
`userId`, `name`, `targetAmount`, `savedAmount`, `deadline`, `autoSavePercentage`, `notes`

### Notification
`userId`, `type`, `message`, `read`, `createdAt`

### CurrencyTransaction
`userId`, `originalAmount`, `originalCurrency`, `convertedAmount`, `convertedCurrency`, `exchangeRate`, `createdAt`

### Settings (Singleton)
`categories[]`, `categoryLimits` (Map), `updatedAt`

