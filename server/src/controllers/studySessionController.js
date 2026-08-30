import mongoose from "mongoose";
import Document from "../models/Document.js";
import StudySession from "../models/StudySession.js";
import StudyTurn from "../models/StudyTurn.js";
import asyncHandler from "../utils/asyncHandler.js";
import { GroqServiceError } from "../services/groqService.js";
import {
  generateFirstQuestion,
  evaluateAnswerAndGenerateNext,
} from "../services/studyModeService.js";
import { MAX_TOPIC_LENGTH } from "../constants/weakTopicConstants.js";

const VALID_DIFFICULTIES = ["easy", "medium", "hard", "mixed"];
const ALLOWED_QUESTION_LIMITS = [5, 10, 15, 20];

const serializeSession = (session) => ({
  id: session._id,
  document: session.document,
  difficulty: session.difficulty,
  questionLimit: session.questionLimit,
  questionsAsked: session.questionsAsked,
  questionsCorrect: session.questionsCorrect,
  questionsPartiallyCorrect: session.questionsPartiallyCorrect,
  questionsIncorrect: session.questionsIncorrect,
  currentTopic: session.currentTopic,
  status: session.status,
  startedAt: session.startedAt,
  completedAt: session.completedAt,
});

// @desc   Start a new study session for a document
// @route  POST /api/study-sessions
// @access Private
export const createStudySession = asyncHandler(async (req, res) => {
  const { documentId, difficulty, questionLimit } = req.body;

  if (!documentId || !mongoose.isValidObjectId(documentId)) {
    return res.status(400).json({ success: false, message: "A valid documentId is required" });
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: "Difficulty must be one of: easy, medium, hard, mixed",
    });
  }

  const limit = parseInt(questionLimit, 10);
  if (!ALLOWED_QUESTION_LIMITS.includes(limit)) {
    return res.status(400).json({
      success: false,
      message: `Session length must be one of: ${ALLOWED_QUESTION_LIMITS.join(", ")}`,
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

  // Never allow a second active session for the same user + document
  // (spec section 29) — let the frontend resume the existing one instead.
  const existingActive = await StudySession.findOne({
    user: req.user._id,
    document: documentId,
    status: "active",
  });

  if (existingActive) {
    return res.status(409).json({
      success: false,
      message: "You already have an active study session for this document.",
      activeSessionId: existingActive._id,
    });
  }

  let generated;
  try {
    generated = await generateFirstQuestion({ documentId, difficulty });
  } catch (error) {
    if (error instanceof GroqServiceError) {
      return res.status(error.status || 502).json({ success: false, message: error.message });
    }

    console.error("Study session start failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "We couldn't start the study session right now. Please try again.",
    });
  }

  const now = new Date();

  const session = await StudySession.create({
    user: req.user._id,
    document: documentId,
    difficulty,
    questionLimit: limit,
    currentTopic: generated.topic || "",
    currentQuestion: generated.question,
    status: "active",
    startedAt: now,
  });

  return res.status(201).json({
    success: true,
    session: serializeSession(session),
    question: session.currentQuestion,
  });
});

// @desc   Submit an answer to the current question of an active session
// @route  POST /api/study-sessions/:sessionId/answer
// @access Private
export const submitStudyAnswer = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { answer } = req.body;

  if (!mongoose.isValidObjectId(sessionId)) {
    return res.status(404).json({ success: false, message: "Study session not found" });
  }

  if (typeof answer !== "string" || !answer.trim()) {
    return res.status(400).json({ success: false, message: "Please enter an answer before submitting." });
  }

  // Ownership enforced directly in the query — never trust a session id
  // alone; it must belong to the authenticated user.
  const session = await StudySession.findOne({ _id: sessionId, user: req.user._id });

  if (!session) {
    return res.status(404).json({ success: false, message: "Study session not found" });
  }

  if (session.status === "completed") {
    return res.status(409).json({ success: false, message: "This study session is already completed." });
  }

  if (session.status === "abandoned") {
    return res.status(409).json({ success: false, message: "This study session was abandoned." });
  }

  if (!session.currentQuestion) {
    return res.status(409).json({ success: false, message: "There is no active question for this session." });
  }

  const willComplete = session.questionsAsked + 1 >= session.questionLimit;
  const trimmedAnswer = answer.trim();

  let result;
  try {
    result = await evaluateAnswerAndGenerateNext({
      session,
      currentQuestion: session.currentQuestion,
      studentAnswer: trimmedAnswer,
      needNextQuestion: !willComplete,
    });
  } catch (error) {
    if (error instanceof GroqServiceError) {
      return res.status(error.status || 502).json({ success: false, message: error.message });
    }

    console.error("Study answer evaluation failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "We couldn't evaluate your answer right now. Please try again.",
    });
  }

  await StudyTurn.create({
    session: session._id,
    user: req.user._id,
    question: session.currentQuestion,
    studentAnswer: trimmedAnswer,
    correctness: result.correctness,
    feedback: result.feedback,
    explanation: result.explanation,
    // session.currentTopic here is still the topic of the question just
    // answered — it only gets overwritten to nextTopic below, after this
    // record is created (spec section 8).
    topic: (session.currentTopic || "").trim().slice(0, MAX_TOPIC_LENGTH),
  });

  session.questionsAsked += 1;
  if (result.correctness === "correct") session.questionsCorrect += 1;
  else if (result.correctness === "partial") session.questionsPartiallyCorrect += 1;
  else session.questionsIncorrect += 1;

  if (willComplete) {
    session.status = "completed";
    session.completedAt = new Date();
    session.currentQuestion = "";
  } else {
    session.currentQuestion = result.nextQuestion;
    if (result.nextTopic) session.currentTopic = result.nextTopic;
  }

  await session.save();

  const payload = {
    success: true,
    evaluation: {
      correctness: result.correctness,
      feedback: result.feedback,
      explanation: result.explanation,
    },
    session: serializeSession(session),
    completed: session.status === "completed",
  };

  if (session.status === "completed") {
    payload.result = {
      questionsAsked: session.questionsAsked,
      correct: session.questionsCorrect,
      partial: session.questionsPartiallyCorrect,
      incorrect: session.questionsIncorrect,
      accuracy: Math.round((session.questionsCorrect / session.questionsAsked) * 100),
    };
  } else {
    payload.nextQuestion = session.currentQuestion;
  }

  return res.status(200).json(payload);
});

// @desc   Get a single study session (with its answered turns)
// @route  GET /api/study-sessions/:sessionId
// @access Private
export const getStudySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!mongoose.isValidObjectId(sessionId)) {
    return res.status(404).json({ success: false, message: "Study session not found" });
  }

  const session = await StudySession.findOne({
    _id: sessionId,
    user: req.user._id,
  }).populate("document", "title");

  if (!session) {
    return res.status(404).json({ success: false, message: "Study session not found" });
  }

  // Every StudyTurn only exists after evaluation, so it's always safe to
  // reveal — the "don't reveal early" rule only applies to the *current*,
  // not-yet-answered question, which is handled separately below.
  const turns = await StudyTurn.find({ session: session._id })
    .sort({ createdAt: 1 })
    .select("question studentAnswer correctness feedback explanation createdAt");

  const payload = {
    success: true,
    session: {
      ...serializeSession(session),
      document: { id: session.document?._id, title: session.document?.title },
    },
    turns: turns.map((t) => ({
      question: t.question,
      studentAnswer: t.studentAnswer,
      correctness: t.correctness,
      feedback: t.feedback,
      explanation: t.explanation,
      createdAt: t.createdAt,
    })),
  };

  if (session.status === "active") {
    payload.currentQuestion = session.currentQuestion;
  }

  return res.status(200).json(payload);
});

// @desc   List the authenticated user's study sessions
// @route  GET /api/study-sessions?documentId=...
// @access Private
export const listStudySessions = asyncHandler(async (req, res) => {
  const { documentId } = req.query;
  const filter = { user: req.user._id };

  if (documentId) {
    if (!mongoose.isValidObjectId(documentId)) {
      return res.status(400).json({ success: false, message: "Invalid documentId" });
    }
    filter.document = documentId;
  }

  const sessions = await StudySession.find(filter)
    .sort({ createdAt: -1 })
    .populate("document", "title");

  const result = sessions.map((session) => ({
    id: session._id,
    document: { id: session.document?._id, title: session.document?.title },
    difficulty: session.difficulty,
    questionLimit: session.questionLimit,
    questionsAsked: session.questionsAsked,
    status: session.status,
    accuracy:
      session.questionsAsked > 0
        ? Math.round((session.questionsCorrect / session.questionsAsked) * 100)
        : null,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
  }));

  return res.status(200).json({ success: true, sessions: result });
});

// @desc   Abandon an active study session
// @route  POST /api/study-sessions/:sessionId/abandon
// @access Private
export const abandonStudySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!mongoose.isValidObjectId(sessionId)) {
    return res.status(404).json({ success: false, message: "Study session not found" });
  }

  const session = await StudySession.findOne({ _id: sessionId, user: req.user._id });

  if (!session) {
    return res.status(404).json({ success: false, message: "Study session not found" });
  }

  if (session.status !== "active") {
    return res.status(409).json({ success: false, message: "Only an active session can be abandoned." });
  }

  session.status = "abandoned";
  session.currentQuestion = "";
  await session.save();

  return res.status(200).json({ success: true, session: serializeSession(session) });
});