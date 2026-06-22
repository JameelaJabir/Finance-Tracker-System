import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;

    //validation
    if (!name) {
      return res.send({ message: "Name is Required" });
    }
    if (!email) {
      return res.send({ message: "Email is Required" });
    }
    if (!password) {
      return res.send({ message: "A password is Required" });
    }
    if (!phone) {
      return res.send({ message: "Phone no is Required" });
    }
    if (!address) {
      return res.send({ message: "Address" });
    }
    if (!answer) {
      return res.send({ message: "Answer" });
    }
    //Check user
    const existingUser = await userModel.findOne({ email });
    //Existing user
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "Already Registered please Login",
      });
    }

    //register user
    const hashedPassword = await hashPassword(password);

    //save
    const user = await new userModel({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      answer,
    }).save();

    res.status(201).send({
      success: true,
      message: "User Register Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Registration",
      error,
    });
  }
};

//POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    //check user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: true,
        message: "Email is not registered",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid password",
      });
    }
    //token
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).send({
      success: true,
      message: "Login successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

//forgotPasswordController
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      res.status(400).send({ message: "Email is required" });
    }
    if (!answer) {
      res.status(400).send({ message: "Answer is required" });
    }
    if (!newPassword) {
      res.status(400).send({ message: "New Password is required" });
    }
    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

//test controller
export const testController = (req, res) => {
  try {
    res.send("Protected Routes");
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
};

// Controller function to update user profile
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if req.user exists and has the _id property
    if (!req.user || !req.user._id) {
      return res.status(400).json({
        success: false,
        message: "User ID not provided in request",
      });
    }

    // Find the user by ID
    const user = await userModel.findById(req.user._id);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.password = password || user.password;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    // Update password if provided
    if (password) {
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }
      // Hash the password
      const hashedPassword = await hashPassword(password);
      user.password = hashedPassword;
    }

    // Save the updated user
    const updatedUser = await user.save();

    // Respond with success message and updated user
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedUser,
    });
  } catch (error) {
    // Handle errors
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};
//delete profile
export const deleteProfileController = async (req, res) => {
  try {
    // Get user ID from request parameters or JWT token
    //const userId = req.params.userId; // Assuming the user ID is passed as a route parameter

    // Check if user exists
    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Delete the user
    await userModel.findByIdAndDelete(user._id);

    // Optionally, perform any additional cleanup or related actions here

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Controller function to get all users
export const getAllUsersController = async (req, res) => {
  try {
    // Attempt to find all users in the database
    const users = await userModel.find({});

    // Check if any users were found
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found.",
      });
    }

    // Send the users as a JSON response
    res.status(200).json({
      success: true,
      message: "Users found successfully.",
      data: users,
    });
  } catch (error) {
    // If an error occurs during the process
    console.log(error); // Log the error to the console for debugging

    // Send a detailed error response
    res.status(500).json({
      success: false,
      message: "Error while getting users.",
      error: error.message, // Only sending error message for security reasons
    });
  }
};
