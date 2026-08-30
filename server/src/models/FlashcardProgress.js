import mongoose from "mongoose";

const flashcardProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    flashcardSet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FlashcardSet",
      required: true,
      index: true,
    },
    cardIndex: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["known", "review"],
      required: true,
    },
    reviewedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// One current status per user + set + card — re-marking a card updates
// this same row rather than creating a growing history.
flashcardProgressSchema.index(
  { user: 1, flashcardSet: 1, cardIndex: 1 },
  { unique: true }
);

const FlashcardProgress = mongoose.model("FlashcardProgress", flashcardProgressSchema);

export default FlashcardProgress;