import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
    sourceChunks: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "DocumentChunk",
      default: [],
      select: false, // backend-only, per spec section 10
    },
  },
  { _id: true }
);

const flashcardSetSchema = new mongoose.Schema(
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
      enum: ["easy", "medium", "hard", "mixed"],
      required: true,
    },
    cardCount: {
      type: Number,
      required: true,
    },
    cards: {
      type: [cardSchema],
      required: true,
    },
  },
  { timestamps: true }
);

flashcardSetSchema.index({ user: 1, document: 1, createdAt: -1 });

const FlashcardSet = mongoose.model("FlashcardSet", flashcardSetSchema);

export default FlashcardSet;