import express from "express";
import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";
import { getAllTransactions, deleteUserAccount, getAllUsers } from "../controllers/adminController.js";
import { getSettings, addCategory, deleteCategory, updateCategoryLimit } from "../controllers/settingsController.js";

const router = express.Router();

// All routes require admin access
router.use(requireSignIn, isAdmin);

// Transactions oversight
router.get("/transactions", getAllTransactions);

// User management
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUserAccount);

// System settings
router.get("/settings", getSettings);
router.post("/settings/categories", addCategory);
router.delete("/settings/categories/:category", deleteCategory);
router.put("/settings/category-limits", updateCategoryLimit);

export default router;
