import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Covers expired tokens, malformed tokens, invalid signature, etc.
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(401).json({ message: "Not authorized, user no longer exists" });
  }

  req.user = user;
  next();
});