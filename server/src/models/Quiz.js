import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length === 4,
        message: "Each question must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      select: false, // never returned to the frontend before submission
    },
    explanation: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      trim: true,
      default: "",
      // Kept in sync with MAX_TOPIC_LENGTH in constants/weakTopicConstants.js.
      maxlength: 60,
    },
    sourceChunks: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "DocumentChunk",
      default: [],
      select: false, // backend-only, per spec section 25
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    questionCount: {
      type: Number,
      required: true,
    },
    questions: {
      type: [questionSchema],
      required: true,
    },
  },
  { timestamps: true }
);

quizSchema.index({ user: 1, document: 1, createdAt: -1 });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;