import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "docx", "txt"],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
      select: false,
    },
    extractedText: {
      type: String,
      default: "",
      select: false,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    processingStatus: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
    processingError: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ user: 1, subject: 1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;