import mongoose from "mongoose";
import { GOAL_TYPES } from "../constants/goalConstants.js";

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: GOAL_TYPES,
      required: true,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
    // Always stored as a UTC-midnight Date representing the calendar day
    // this goal belongs to (spec section 3/17) — never a timestamp.
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// One active goal per type per day per user (spec section 4).
goalSchema.index({ user: 1, date: 1, type: 1 }, { unique: true });

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;