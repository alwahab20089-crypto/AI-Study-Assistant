// Central place for every goal-related constant, mirroring the pattern
// used in weakTopicConstants.js.

export const GOAL_TYPES = ["study_time", "quiz_questions", "flashcards"];

// Reasonable validation safeguards (spec section 16) — not recommendations.
export const GOAL_LIMITS = {
  study_time: { min: 1, max: 1440 },
  quiz_questions: { min: 1, max: 500 },
  flashcards: { min: 1, max: 500 },
};

// Caps how wide a /api/goals?from=&to= history query can be, so it can't
// be abused to pull unlimited data (spec section 28).
export const GOAL_HISTORY_MAX_DAYS = 31;