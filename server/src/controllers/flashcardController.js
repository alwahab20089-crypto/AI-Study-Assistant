import mongoose from "mongoose";
import Document from "../models/Document.js";
import FlashcardSet from "../models/FlashcardSet.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateFlashcardContent } from "../services/flashcardService.js";
import { GroqServiceError } from "../services/groqService.js";
import FlashcardProgress from "../models/FlashcardProgress.js";

const VALID_DIFFICULTIES = ["easy", "medium", "hard", "mixed"];

const getCardCountBounds = () => ({
  min: parseInt(process.env.FLASHCARD_MIN_CARDS, 10) || 5,
  max: parseInt(process.env.FLASHCARD_MAX_CARDS, 10) || 20,
});

// Strips sourceChunks (and any other backend-only fields) before sending
// to the frontend — the flashcard equivalent of quizController's
// sanitizeQuestionsForDelivery.
const sanitizeCardsForDelivery = (cards) => {
  return cards.map((card) => ({
    id: card._id,
    front: card.front,
    back: card.back,
  }));
};

// @desc   Generate a flashcard set from a document
// @route  POST /api/flashcards
// @access Private
export const generateFlashcards = asyncHandler(async (req, res) => {
  const { documentId, cardCount, difficulty } = req.body;
  const { min, max } = getCardCountBounds();

  if (!documentId || !mongoose.isValidObjectId(documentId)) {
    return res.status(400).json({ success: false, message: "A valid documentId is required" });
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: "Difficulty must be one of: easy, medium, hard, mixed",
    });
  }

  const count = parseInt(cardCount, 10);
  if (!Number.isInteger(count) || count < min || count > max) {
    return res.status(400).json({
      success: false,
      message: `Number of cards must be between ${min} and ${max}`,
    });
  }

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
      message: "This document is still being processed. Please try again shortly.",
    });
  }

  if (document.processingStatus === "failed") {
    return res.status(422).json({
      success: false,
      message: "This document couldn't be indexed. Try re-uploading it.",
    });
  }

  let generated;
  try {
    generated = await generateFlashcardContent(documentId, count, difficulty);
  } catch (error) {
    if (error instanceof GroqServiceError) {
      return res.status(error.status || 502).json({ success: false, message: error.message });
    }
    console.error("Flashcard generation failed:", error);
    return res.status(500).json({
      success: false,
      message: "We couldn't generate flashcards right now. Please try again.",
    });
  }

  const flashcardSet = await FlashcardSet.create({
    user: req.user._id,
    document: documentId,
    title: generated.title,
    difficulty,
    cardCount: count,
    cards: generated.cards,
  });

  res.status(201).json({
    success: true,
    flashcardSet: {
      id: flashcardSet._id,
      title: flashcardSet.title,
      difficulty: flashcardSet.difficulty,
      cardCount: flashcardSet.cardCount,
      cards: sanitizeCardsForDelivery(flashcardSet.cards),
      createdAt: flashcardSet.createdAt,
    },
  });
});
// @desc   Get a single flashcard set for studying
// @route  GET /api/flashcards/:flashcardSetId
// @access Private
export const getFlashcardSet = asyncHandler(async (req, res) => {
  const { flashcardSetId } = req.params;

  if (!mongoose.isValidObjectId(flashcardSetId)) {
    return res.status(404).json({ success: false, message: "Flashcard set not found" });
  }

  const flashcardSet = await FlashcardSet.findOne({
    _id: flashcardSetId,
    user: req.user._id,
  });

  if (!flashcardSet) {
    return res.status(404).json({ success: false, message: "Flashcard set not found" });
  }

  res.status(200).json({
    success: true,
    flashcardSet: {
      id: flashcardSet._id,
      documentId: flashcardSet.document,
      title: flashcardSet.title,
      difficulty: flashcardSet.difficulty,
      cardCount: flashcardSet.cardCount,
      cards: sanitizeCardsForDelivery(flashcardSet.cards),
      createdAt: flashcardSet.createdAt,
    },
  });
});

// @desc   List the authenticated user's flashcard sets, optionally filtered by document
// @route  GET /api/flashcards?documentId=...
// @access Private
export const listFlashcardSets = asyncHandler(async (req, res) => {
  const { documentId } = req.query;

  const filter = { user: req.user._id };

  if (documentId) {
    if (!mongoose.isValidObjectId(documentId)) {
      return res.status(400).json({ success: false, message: "Invalid documentId" });
    }
    filter.document = documentId;
  }

  const flashcardSets = await FlashcardSet.find(filter)
    .sort({ createdAt: -1 })
    .select("title difficulty cardCount document createdAt")
    .populate("document", "title");

  res.status(200).json({
    success: true,
    flashcardSets: flashcardSets.map((set) => ({
      id: set._id,
      title: set.title,
      difficulty: set.difficulty,
      cardCount: set.cardCount,
      document: {
        id: set.document?._id,
        title: set.document?.title,
      },
      createdAt: set.createdAt,
    })),
  });
});
// @desc   Record a study response (known/review) for one card
// @route  POST /api/flashcards/:flashcardSetId/progress
// @access Private
export const submitFlashcardProgress = asyncHandler(async (req, res) => {
  const { flashcardSetId } = req.params;
  const { cardIndex, status } = req.body;

  if (!mongoose.isValidObjectId(flashcardSetId)) {
    return res.status(404).json({ success: false, message: "Flashcard set not found" });
  }

  if (!["known", "review"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be 'known' or 'review'" });
  }

  const flashcardSet = await FlashcardSet.findOne({
    _id: flashcardSetId,
    user: req.user._id,
  }).select("cardCount");

  if (!flashcardSet) {
    return res.status(404).json({ success: false, message: "Flashcard set not found" });
  }

  const index = Number(cardIndex);
  if (!Number.isInteger(index) || index < 0 || index >= flashcardSet.cardCount) {
    return res.status(400).json({ success: false, message: "Invalid card index" });
  }

  // Upsert on the unique {user, flashcardSet, cardIndex} key — re-marking
  // a card updates its current status rather than creating a duplicate row.
  const progress = await FlashcardProgress.findOneAndUpdate(
    { user: req.user._id, flashcardSet: flashcardSetId, cardIndex: index },
    { $set: { status, reviewedAt: new Date() } },
    { new: true, upsert: true }
  );

  res.status(200).json({
    success: true,
    progress: {
      cardIndex: progress.cardIndex,
      status: progress.status,
    },
  });
});

// @desc   Get aggregate progress for a flashcard set
// @route  GET /api/flashcards/:flashcardSetId/progress
// @access Private
export const getFlashcardProgress = asyncHandler(async (req, res) => {
  const { flashcardSetId } = req.params;

  if (!mongoose.isValidObjectId(flashcardSetId)) {
    return res.status(404).json({ success: false, message: "Flashcard set not found" });
  }

  const flashcardSet = await FlashcardSet.findOne({
    _id: flashcardSetId,
    user: req.user._id,
  }).select("cardCount");

  if (!flashcardSet) {
    return res.status(404).json({ success: false, message: "Flashcard set not found" });
  }

  const entries = await FlashcardProgress.find({
    user: req.user._id,
    flashcardSet: flashcardSetId,
  }).select("cardIndex status");

  const known = entries.filter((e) => e.status === "known").length;
  const review = entries.filter((e) => e.status === "review").length;

  res.status(200).json({
    success: true,
    progress: {
      total: flashcardSet.cardCount,
      known,
      review,
      reviewedCardIndexes: entries.filter((e) => e.status === "review").map((e) => e.cardIndex),
    },
  });
});