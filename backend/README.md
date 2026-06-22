[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xIbq4TFL)

Personal Finance Tracker API
Overview
This project implements a Secure RESTful API for managing a Personal Finance Tracker system. The system allows users to manage their financial records, track expenses, set budgets, analyze spending trends, and manage financial goals. The API is designed to provide secure access to users with role-based authentication and authorization.

Install Dependencies
For Node.js based APIs: npm install

Starting the server : npm run server

Base URL : http://localhost:8086

User Authentication
Register: POST /api/v1/auth/register
Login: POST /api/v1/auth/login
Forgot Password: POST /api/v1/auth/forgot-password
Update Profile: PUT /api/v1/auth/update-profile
Delete Profile: DELETE /api/v1/auth/delete-profile
Get All Users: GET /api/v1/auth/list-users
Protected User route auth: GET /api/v1/auth/user-auth
Protected Admin route auth: GET /api/v1/auth/user-auth

Transactions
Create Transaction: POST /api/v1/transactions/add-transaction
Get All Transactions: GET /api/v1/transactions/get-transactions
Update Transaction: PUT /api/v1/transactions/update-transaction/:id
Delete Transaction: DELETE /api/v1/transactions/delete-transaction/:id
Filter transactions: GET /api/v1/transactions/filter-transactions

Budgets
Create Budget: POST /api/v1/budgets/create-budget
Get All Budgets: GET /api/v1/budgets/get-budget
Get Budget by ID: GET /api/v1/budgets/get-budget/:id
Update Budget: PUT /api/v1/budgets/update-budget/:id
Delete Budget: DELETE /api/v1/budgets/delete-budget/:id
Get budget analysis: GET /api/v1/budgets/analysis-budget/status

Goals
Create Goal: POST /api/v1/goals/create-goal
Get All Goals: GET /api/v1/goals/list-goals
Update Goal: PUT /api/v1/goals/update-goal/:id
Delete Goal: DELETE /api/v1/goals/delete-goal/:id

Currency Transaction
Add a currency transaction: POST /api/v1/currencyTransactionRoutes/create-currency-transactions
Get all currency transactions of a user: GET /api/v1/currencyTransactionRoutes/get-currency-transactions/:userId

Dashboard Roles
Admin Dashboard Route: GET /api/v1/dashboard/admin
Regular User Dashboard Route: GET /api/v1/dashboard/user

Notification
Generate spending trends: GET /api/v1/reports/spending-trends
Income vs. expense chart: GET /api/v1/reports/income-vs-expenses
Filtered reports: GET /api/v1/reports/filtered-report

Testing Instructions
Unit Testing : npm test
