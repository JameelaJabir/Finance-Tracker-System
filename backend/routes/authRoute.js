import express from "express";
import {
  registerController,
  loginController,
  testController,
  forgotPasswordController,
  updateProfileController,
  getAllUsersController,
  deleteProfileController,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
//router object
const router = express.Router();

//routing
//REGISTER || method POST
router.post("/register", registerController);

//LOGIN || POST
router.post("/login", loginController);

//Forgot password || POST
router.post("/forgot-password", forgotPasswordController);

//test routes
router.get("/test", requireSignIn, isAdmin, testController);

//protected  User route auth
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

//protected  Admin route auth
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

//Update profile
router.put("/update-profile", requireSignIn, updateProfileController);

//Delete profile
router.delete("/delete-profile", requireSignIn, deleteProfileController);

//view users from Admin side
router.get("/list-users", requireSignIn, isAdmin, getAllUsersController);

export default router;
