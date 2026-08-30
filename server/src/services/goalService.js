import mongoose from "mongoose";
import Goal from "../models/Goal.js";
import StudySession from "../models/StudySession.js";
import QuizAttempt from "../models/QuizAttempt.js";
import FlashcardProgress from "../models/FlashcardProgress.js";
import {
  isValidGoalType,
  validateGoalTarget,
  parseCalendarDate,
} from "../utils/goalValidator.js";
import { GOAL_HISTORY_MAX_DAYS } from "../constants/goalConstants.js";

// ---------------------------------------------------------------------
// Error types — controller maps these to HTTP status codes.
// ---------------------------------------------------------------------

export class GoalValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "GoalValidationError";
    this.status = 400;
  }
}

export class GoalNotFoundError extends Error {
  constructor(message = "Goal not found") {
    super(message);
    this.name = "GoalNotFoundError";
    this.status = 404;
  }
}

export class GoalConflictError extends Error {
  constructor(message, existingGoal) {
    super(message);
    this.name = "GoalConflictError";
    this.status = 409;
    this.existingGoal = existingGoal;
  }
}

// ---------------------------------------------------------------------
// Date helpers — same UTC-day convention as progressService.js
// ---------------------------------------------------------------------

const startOfUtcDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const endOfUtcDay = (date) => {
  const d = startOfUtcDay(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
};

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

// ---------------------------------------------------------------------
// Progress calculation — Goal never stores progress. Everything below
// is derived live from the same collections Phase 8/10 already use
// (spec sections 7, 30, 31).
// ---------------------------------------------------------------------

const calcStudyTimeMinutes = async (userId, dayStart, dayEnd) => {
  const agg = await StudySession.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        status: "completed",
        completedAt: { $gte: dayStart, $lt: dayEnd },
      },
    },
    {
      $project: {
        durationMs: { $subtract: ["$completedAt", "$startedAt"] },
      },
    },
    { $group: { _id: null, totalMs: { $sum: "$durationMs" } } },
  ]);

  const totalMs = agg.length > 0 ? agg[0].totalMs : 0;
  return Math.max(0, Math.round(totalMs / 60000));
};

const calcQuizQuestionsAnswered = async (userId, dayStart, dayEnd) => {
  // Count only questions actually answered (selectedAnswer !== -1), not
  // every question in the quiz — a quiz submission always includes one
  // entry per question, answered or not (spec section 8).
  const agg = await QuizAttempt.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        completedAt: { $gte: dayStart, $lt: dayEnd },
      },
    },
    {
      $project: {
        answeredCount: {
          $size: {
            $filter: {
              input: "$answers",
              as: "a",
              cond: { $ne: ["$$a.selectedAnswer", -1] },
            },
          },
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$answeredCount" } } },
  ]);

  return agg.length > 0 ? agg[0].total : 0;
};

const calcFlashcardsReviewed = async (userId, dayStart, dayEnd) => {
  // FlashcardProgress has a unique (user, flashcardSet, cardIndex) row
  // that gets upserted on re-review, so this already counts distinct
  // cards reviewed today — never inflated by repeat reviews of the same
  // card (spec section 31).
  return FlashcardProgress.countDocuments({
    user: userId,
    reviewedAt: { $gte: dayStart, $lt: dayEnd },
  });
};

const calcProgress = async (userId, goal) => {
  const dayStart = startOfUtcDay(goal.date);
  const dayEnd = endOfUtcDay(goal.date);

  let progress;
  switch (goal.type) {
    case "study_time":
      progress = await calcStudyTimeMinutes(userId, dayStart, dayEnd);
      break;
    case "quiz_questions":
      progress = await calcQuizQuestionsAnswered(userId, dayStart, dayEnd);
      break;
    case "flashcards":
      progress = await calcFlashcardsReviewed(userId, dayStart, dayEnd);
      break;
    default:
      progress = 0;
  }

  const percentage = Math.min(100, Math.round((progress / goal.target) * 100));
  const completed = progress >= goal.target;

  return { progress, percentage, completed };
};

const serializeGoal = (goal, progressData) => ({
  id: goal._id,
  type: goal.type,
  target: goal.target,
  date: toDateKey(goal.date),
  ...progressData,
});

// ---------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------

const validateCreateInput = ({ type, target, date }) => {
  if (!isValidGoalType(type)) {
    throw new GoalValidationError(
      "type must be one of: study_time, quiz_questions, flashcards"
    );
  }

  const targetCheck = validateGoalTarget(type, target);
  if (!targetCheck.valid) {
    throw new GoalValidationError(targetCheck.reason);
  }

  const parsedDate = parseCalendarDate(date);
  if (!parsedDate) {
    throw new GoalValidationError("date must be a valid YYYY-MM-DD date");
  }

  return { type, target: targetCheck.value, date: parsedDate };
};

// Create a new goal. Throws GoalConflictError if the user already has a
// goal of that type for that day (spec section 4/22) unless `replace`
// is true, in which case the existing goal's target is updated instead
// of creating a duplicate record.
export const createGoal = async (userId, data, { replace = false } = {}) => {
  const { type, target, date } = validateCreateInput(data);

  const existing = await Goal.findOne({ user: userId, type, date });

  if (existing) {
    if (!replace) {
      throw new GoalConflictError(
        `You already have a ${type} goal for this day.`,
        serializeGoal(existing, await calcProgress(userId, existing))
      );
    }

    existing.target = target;
    await existing.save();
    return serializeGoal(existing, await calcProgress(userId, existing));
  }

  const goal = await Goal.create({ user: userId, type, target, date });
  return serializeGoal(goal, await calcProgress(userId, goal));
};

// Update only the target of an existing goal. Never resets progress,
// since progress is always derived live, not stored (spec section 23).
export const updateGoalTarget = async (userId, goalId, target) => {
  const goal = await Goal.findOne({ _id: goalId, user: userId });

  if (!goal) {
    throw new GoalNotFoundError();
  }

  const targetCheck = validateGoalTarget(goal.type, target);
  if (!targetCheck.valid) {
    throw new GoalValidationError(targetCheck.reason);
  }

  goal.target = targetCheck.value;
  await goal.save();

  return serializeGoal(goal, await calcProgress(userId, goal));
};

// Delete a goal. Only removes the Goal record itself — never touches
// StudySession/QuizAttempt/FlashcardProgress (spec section 18).
export const deleteGoal = async (userId, goalId) => {
  const goal = await Goal.findOneAndDelete({ _id: goalId, user: userId });

  if (!goal) {
    throw new GoalNotFoundError();
  }

  return { id: goal._id };
};

// Today's goals, each with live progress attached.
export const getTodaysGoals = async (userId) => {
  const today = startOfUtcDay(new Date());
  const goals = await Goal.find({ user: userId, date: today }).sort({
    createdAt: 1,
  });

  return Promise.all(
    goals.map(async (goal) => serializeGoal(goal, await calcProgress(userId, goal)))
  );
};

// Goal history for a date range (spec section 28) — used by the
// Progress page if it wants more than just today.
export const getGoalHistory = async (userId, fromStr, toStr) => {
  const from = parseCalendarDate(fromStr);
  const to = parseCalendarDate(toStr);

  if (!fromStr || !toStr || !from || !to) {
    throw new GoalValidationError("from and to must both be valid YYYY-MM-DD dates");
  }

  if (from > to) {
    throw new GoalValidationError("from must not be after to");
  }

  const spanDays = Math.round((to - from) / (24 * 60 * 60 * 1000)) + 1;
  if (spanDays > GOAL_HISTORY_MAX_DAYS) {
    throw new GoalValidationError(
      `date range cannot exceed ${GOAL_HISTORY_MAX_DAYS} days`
    );
  }

  const goals = await Goal.find({
    user: userId,
    date: { $gte: from, $lte: to },
  }).sort({ date: -1, createdAt: 1 });

  return Promise.all(
    goals.map(async (goal) => serializeGoal(goal, await calcProgress(userId, goal)))
  );
};