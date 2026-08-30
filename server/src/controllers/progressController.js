import asyncHandler from "../utils/asyncHandler.js";
import * as progressService from "../services/progressService.js";
import * as weakTopicService from "../services/weakTopicService.js";

// @desc   Summary counts across the student's study activity
// @route  GET /api/progress/overview
// @access Private
export const getOverview = asyncHandler(async (req, res) => {
  const overview = await progressService.getOverview(req.user._id);
  return res.status(200).json({ success: true, overview });
});

// @desc   Quiz score stats and history
// @route  GET /api/progress/quiz-performance
// @access Private
export const getQuizPerformance = asyncHandler(async (req, res) => {
  const { performance, history } = await progressService.getQuizPerformance(req.user._id);
  return res.status(200).json({ success: true, performance, history });
});

// @desc   Flashcard review stats
// @route  GET /api/progress/flashcards
// @access Private
export const getFlashcardProgress = asyncHandler(async (req, res) => {
  const flashcards = await progressService.getFlashcardProgress(req.user._id);
  return res.status(200).json({ success: true, flashcards });
});

// @desc   Study session stats
// @route  GET /api/progress/study-sessions
// @access Private
export const getStudySessionStats = asyncHandler(async (req, res) => {
  const studySessions = await progressService.getStudySessionStats(req.user._id);
  return res.status(200).json({ success: true, studySessions });
});

// @desc   Per-document study activity
// @route  GET /api/progress/documents
// @access Private
export const getDocumentProgress = asyncHandler(async (req, res) => {
  const documents = await progressService.getDocumentProgress(req.user._id);
  return res.status(200).json({ success: true, documents });
});

// @desc   Recent activity feed
// @route  GET /api/progress/activity?limit=10
// @access Private
export const getActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const activities = await progressService.getActivity(req.user._id, limit);
  return res.status(200).json({ success: true, activities });
});

// @desc   Activity for the last 7 days
// @route  GET /api/progress/weekly
// @access Private
export const getWeeklyActivity = asyncHandler(async (req, res) => {
  const days = await progressService.getWeeklyActivity(req.user._id);
  return res.status(200).json({ success: true, days });
});

// @desc   Topics where quiz/study-mode answers suggest extra review could help
// @route  GET /api/progress/weak-topics
// @access Private
export const getWeakTopics = asyncHandler(async (req, res) => {
  const { weakTopics, improvedTopics } = await weakTopicService.getWeakTopics(req.user._id);
  return res.status(200).json({ success: true, weakTopics, improvedTopics });
});