import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      required: true,
    },
    questionLimit: {
      type: Number,
      required: true,
    },
    questionsAsked: {
      type: Number,
      default: 0,
    },
    questionsCorrect: {
      type: Number,
      default: 0,
    },
    questionsPartiallyCorrect: {
      type: Number,
      default: 0,
    },
    questionsIncorrect: {
      type: Number,
      default: 0,
    },
    currentTopic: {
      type: String,
      default: "",
    },
    // The tutor's pending, not-yet-answered question — kept here (not on
    // StudyTurn) since a turn only becomes a real record once it has both
    // a question AND an answer. Cleared once answered and a new one is set.
    currentQuestion: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A user should have at most one active session per document at a time
// (spec section 29 — resume instead of duplicate). This partial index
// only enforces uniqueness among active sessions; completed/abandoned
// ones are unrestricted.
studySessionSchema.index(
  { user: 1, document: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);
studySessionSchema.index({ user: 1, createdAt: -1 });
const StudySession = mongoose.model("StudySession", studySessionSchema);

export default StudySession;