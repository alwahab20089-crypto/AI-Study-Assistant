import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createGoal,
  getTodaysGoals,
  getGoalHistory,
  updateGoal,
  deleteGoal,
} from "../controllers/goalController.js";

const router = express.Router();

router.post("/", protect, createGoal);
router.get("/today", protect, getTodaysGoals);
router.get("/", protect, getGoalHistory);
router.patch("/:goalId", protect, updateGoal);
router.delete("/:goalId", protect, deleteGoal);

export default router;