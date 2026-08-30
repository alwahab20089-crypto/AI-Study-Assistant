import mongoose from "mongoose";

const studyTurnSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudySession",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    studentAnswer: {
      type: String,
      required: true,
    },
    correctness: {
      type: String,
      enum: ["correct", "partial", "incorrect"],
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: "",
    },
    topic: {
      type: String,
      trim: true,
      default: "",
      // Kept in sync with MAX_TOPIC_LENGTH in constants/weakTopicConstants.js.
      maxlength: 60,
    },
  },
  { timestamps: true }
);

studyTurnSchema.index({ session: 1, createdAt: 1 });
studyTurnSchema.index({ user: 1, topic: 1 });

const StudyTurn = mongoose.model("StudyTurn", studyTurnSchema);

export default StudyTurn;