import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
      select: false, // internal — never needed in any API response
    },
    metadata: {
      page: {
        type: Number,
        default: null,
      },
      section: {
        type: String,
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Every retrieval query filters by user first (ownership) and then by
// document — this compound index makes both the "search within one document"
// and general "search across a user's chunks" query patterns efficient.
documentChunkSchema.index({ user: 1, document: 1 });

const DocumentChunk = mongoose.model("DocumentChunk", documentChunkSchema);

export default DocumentChunk;