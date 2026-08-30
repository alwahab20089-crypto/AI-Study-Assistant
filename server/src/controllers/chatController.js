import mongoose from "mongoose";
import Document from "../models/Document.js";
import ChatMessage from "../models/ChatMessage.js";
import asyncHandler from "../utils/asyncHandler.js";
import { answerQuestion } from "../services/ragService.js";
import { GroqServiceError } from "../services/groqService.js";

const getHistoryLimit = () => parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 6;

// @desc   Ask a question about a specific document (RAG chat)
// @route  POST /api/chat
// @access Private
export const sendChatMessage = asyncHandler(async (req, res) => {
  const { documentId, message } = req.body;

  if (!documentId || !mongoose.isValidObjectId(documentId)) {
    return res.status(400).json({ success: false, message: "A valid documentId is required" });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: "Question cannot be empty" });
  }

  const question = message.trim();

  const document = await Document.findOne({
    _id: documentId,
    user: req.user._id,
  }).select("processingStatus title");

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  if (document.processingStatus === "processing") {
    return res.status(409).json({
      success: false,
      message: "This document is still being processed. Please try again in a moment.",
    });
  }

  if (document.processingStatus === "failed") {
    return res.status(422).json({
      success: false,
      message: "This document couldn't be indexed for AI chat. Try re-uploading it.",
    });
  }

  // Load recent history for this user + document only — same ownership
  // scoping as everything else. Fetched oldest-first within the limited
  // recent window so it reads naturally as conversation order.
  const historyLimit = getHistoryLimit();
  const recentMessages = await ChatMessage.find({
    user: req.user._id,
    document: documentId,
  })
    .sort({ createdAt: -1 })
    .limit(historyLimit)
    .select("role content");

  const conversationHistory = recentMessages.reverse().map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Persist the user's message before calling the AI, so it's never lost
  // even if the Groq call subsequently fails.
  await ChatMessage.create({
    user: req.user._id,
    document: documentId,
    role: "user",
    content: question,
  });

  try {
    const { answer, sources } = await answerQuestion({
      question,
      userId: req.user._id,
      documentId,
      conversationHistory,
    });

    await ChatMessage.create({
      user: req.user._id,
      document: documentId,
      role: "assistant",
      content: answer,
      sources,
    });

    res.status(200).json({
      success: true,
      answer,
      sources,
    });
  } catch (error) {
    if (error instanceof GroqServiceError) {
      return res.status(error.status || 502).json({
        success: false,
        message: error.message,
      });
    }
    throw error;
  }
});

// @desc   Get chat history for a document
// @route  GET /api/chat/:documentId
// @access Private
export const getChatHistory = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  if (!mongoose.isValidObjectId(documentId)) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  // Same ownership check as every document-scoped endpoint — 404 either
  // way if the document doesn't exist or isn't the user's.
  const document = await Document.findOne({
    _id: documentId,
    user: req.user._id,
  }).select("_id");

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  const messages = await ChatMessage.find({
    user: req.user._id,
    document: documentId,
  })
    .sort({ createdAt: 1 })
    .select("role content sources createdAt");

  res.status(200).json({
    success: true,
    messages,
  });
});