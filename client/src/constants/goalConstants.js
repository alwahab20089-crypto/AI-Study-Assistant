// Keep in sync with server/src/constants/goalConstants.js.
export const GOAL_TYPES = [
  {
    value: "study_time",
    label: "Study Time",
    unit: "min",
    verb: "Study for",
    min: 1,
    max: 1440,
  },
  {
    value: "quiz_questions",
    label: "Quiz Questions",
    unit: "questions",
    verb: "Answer",
    min: 1,
    max: 500,
  },
  {
    value: "flashcards",
    label: "Flashcards",
    unit: "cards",
    verb: "Review",
    min: 1,
    max: 500,
  },
];

export const getGoalMeta = (type) =>
  GOAL_TYPES.find((g) => g.value === type) || GOAL_TYPES[0];