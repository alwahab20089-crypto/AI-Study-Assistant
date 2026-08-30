import mongoose from "mongoose";
import Document from "../models/Document.js";
import Summary from "../models/Summary.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateSummaryForDocument } from "../services/summaryService.js";
import { GroqServiceError } from "../services/groqService.js";

const VALID_LENGTHS = ["short", "medium", "detailed"];

// @desc   Generate (or regenerate) a summary for a document
// @route  POST /api/summaries
// @access Private
export const generateSummary = asyncHandler(async (req, res) => {
  const { documentId, length = "medium", regenerate = false } = req.body;

  if (!documentId || !mongoose.isValidObjectId(documentId)) {
    return res.status(400).json({ success: false, message: "A valid documentId is required" });
  }

  if (!VALID_LENGTHS.includes(length)) {
    return res.status(400).json({
      success: false,
      message: "Length must be one of: short, medium, detailed",
    });
  }

  const document = await Document.findOne({
    _id: documentId,
    user: req.user._id,
  }).select("processingStatus");

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  if (document.processingStatus === "processing") {
    return res.status(409).json({
      success: false,
      message: "This document is still being processed. Please try again shortly.",
    });
  }

  if (document.processingStatus === "failed") {
    return res.status(422).json({
      success: false,
      message: "This document couldn't be indexed. Try re-uploading it.",
    });
  }

  // Avoid unnecessary Groq usage — return the existing summary unless the
  // user explicitly asked to regenerate (per spec section 17).
  if (!regenerate) {
    const existing = await Summary.findOne({
      user: req.user._id,
      document: documentId,
      length,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        summary: {
          id: existing._id,
          length: existing.length,
          content: existing.content,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        },
      });
    }
  }

  let content;
  try {
    content = await generateSummaryForDocument(documentId, length);
  } catch (error) {
    if (error instanceof GroqServiceError) {
      return res.status(error.status || 502).json({ success: false, message: error.message });
    }
    console.error("Summary generation failed:", error);
    return res.status(500).json({
      success: false,
      message: "We couldn't generate the summary right now. Please try again.",
    });
  }

  // Upsert — creates on first generation, overwrites on regenerate, and the
  // unique index on {user, document, length} guarantees no duplicates even
  // under concurrent requests.
  const summary = await Summary.findOneAndUpdate(
    { user: req.user._id, document: documentId, length },
    { $set: { content } },
    { new: true, upsert: true }
  );

  res.status(201).json({
    success: true,
    summary: {
      id: summary._id,
      length: summary.length,
      content: summary.content,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    },
  });
});
// @desc   Get all saved summaries for a document
// @route  GET /api/summaries/:documentId
// @access Private
export const getSummaries = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  if (!mongoose.isValidObjectId(documentId)) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  // Confirm the document belongs to this user before returning anything —
  // same 404-either-way pattern as every other document-scoped endpoint.
  const document = await Document.findOne({
    _id: documentId,
    user: req.user._id,
  }).select("_id");

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  const summaries = await Summary.find({
    user: req.user._id,
    document: documentId,
  })
    .sort({ createdAt: -1 })
    .select("length content createdAt updatedAt");

  res.status(200).json({
    success: true,
    summaries,
  });
});

// @desc   Delete a summary
// @route  DELETE /api/summaries/:summaryId
// @access Private
export const deleteSummary = asyncHandler(async (req, res) => {
  const { summaryId } = req.params;

  if (!mongoose.isValidObjectId(summaryId)) {
    return res.status(404).json({ success: false, message: "Summary not found" });
  }

  // Ownership enforced directly in the query, same pattern as document delete.
  const summary = await Summary.findOneAndDelete({
    _id: summaryId,
    user: req.user._id,
  });

  if (!summary) {
    return res.status(404).json({ success: false, message: "Summary not found" });
  }

  res.status(200).json({
    success: true,
    message: "Summary deleted successfully",
  });
});