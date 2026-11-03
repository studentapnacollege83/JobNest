
const express = require("express");
const authRouter = express.Router();

const authController = require("../controllers/authController");

// Signup
authRouter.get("/signup", authController.getSignup);
authRouter.post("/signup", authController.postSignup);

// Email verification
authRouter.get("/verify-email", authController.verifyEmail);

// Login
authRouter.get("/login", authController.getLogin);
authRouter.post("/login", authController.postLogin);

// Logout
authRouter.post("/logout", authController.postLogout);

module.exports = authRouter;
