import mongoose from "mongoose";

const summarySchema = new mongoose.Schema(
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
    length: {
      type: String,
      enum: ["short", "medium", "detailed"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// One saved summary per user + document + length combination.
// Regenerating the same length updates this record rather than creating a duplicate.
summarySchema.index({ user: 1, document: 1, length: 1 }, { unique: true });
summarySchema.index({ user: 1, createdAt: -1 });
const Summary = mongoose.model("Summary", summarySchema);

export default Summary;