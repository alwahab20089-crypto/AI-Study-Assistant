import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { getCookieOptions } from "../utils/cookieOptions.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Basic presence validation
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Email format validation (extra layer beyond schema)
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email" });
  }

  // Password length validation
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  }

  // Confirm password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // Check for existing user
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  // Create user (password hashed via pre-save hook)
  const user = await User.create({
    name,
    email,
    password,
  });

  // Issue token
  const token = generateToken(user._id);
  res.cookie("token", token, getCookieOptions());

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  });
});
// @desc   Login user
// @route  POST /api/auth/login
// @access Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Basic presence validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Explicitly select password since schema has select: false
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  // Generic error — do not reveal whether email exists
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = generateToken(user._id);
  res.cookie("token", token, getCookieOptions());

  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  });
});
// @desc   Get current authenticated user
// @route  GET /api/auth/me
// @access Private
export const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the `protect` middleware
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
});

// @desc   Logout user
// @route  POST /api/auth/logout
// @access Private
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    ...getCookieOptions(),
    maxAge: 0,
  });

  res.status(200).json({ message: "Logged out successfully" });
});