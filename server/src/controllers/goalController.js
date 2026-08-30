import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import * as goalService from "../services/goalService.js";

// Maps a goalService error (with a .status) to an HTTP response.
// Errors without a .status are unexpected and re-thrown for the
// global error handler in app.js.
const respondWithServiceError = (err, res) => {
  if (!err.status) throw err;

  const payload = { success: false, message: err.message };
  if (err.existingGoal) payload.existingGoal = err.existingGoal;

  return res.status(err.status).json(payload);
};

// @desc   Create a goal (or replace today's existing one of that type)
// @route  POST /api/goals
// @access Private
export const createGoal = asyncHandler(async (req, res) => {
  const { type, target, date, replace } = req.body;

  try {
    const goal = await goalService.createGoal(
      req.user._id,
      { type, target, date },
      { replace: Boolean(replace) }
    );
    return res.status(201).json({ success: true, goal });
  } catch (err) {
    return respondWithServiceError(err, res);
  }
});

// @desc   Get the authenticated user's goals for today, with live progress
// @route  GET /api/goals/today
// @access Private
export const getTodaysGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.getTodaysGoals(req.user._id);
  return res.status(200).json({ success: true, goals });
});

// @desc   Get the authenticated user's goals for a date range
// @route  GET /api/goals?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access Private
export const getGoalHistory = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  try {
    const goals = await goalService.getGoalHistory(req.user._id, from, to);
    return res.status(200).json({ success: true, goals });
  } catch (err) {
    return respondWithServiceError(err, res);
  }
});

// @desc   Update a goal's target (progress is never reset)
// @route  PATCH /api/goals/:goalId
// @access Private
export const updateGoal = asyncHandler(async (req, res) => {
  const { goalId } = req.params;
  const { target } = req.body;

  if (!mongoose.isValidObjectId(goalId)) {
    return res.status(404).json({ success: false, message: "Goal not found" });
  }

  try {
    const goal = await goalService.updateGoalTarget(req.user._id, goalId, target);
    return res.status(200).json({ success: true, goal });
  } catch (err) {
    return respondWithServiceError(err, res);
  }
});

// @desc   Delete a goal (never deletes the underlying activity data)
// @route  DELETE /api/goals/:goalId
// @access Private
export const deleteGoal = asyncHandler(async (req, res) => {
  const { goalId } = req.params;

  if (!mongoose.isValidObjectId(goalId)) {
    return res.status(404).json({ success: false, message: "Goal not found" });
  }

  try {
    await goalService.deleteGoal(req.user._id, goalId);
    return res.status(200).json({ success: true });
  } catch (err) {
    return respondWithServiceError(err, res);
  }
});