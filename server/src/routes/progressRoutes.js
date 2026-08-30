import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getOverview,
  getQuizPerformance,
  getFlashcardProgress,
  getStudySessionStats,
  getDocumentProgress,
  getActivity,
  getWeeklyActivity,
  getWeakTopics,
} from "../controllers/progressController.js";

const router = express.Router();

router.get("/overview", protect, getOverview);
router.get("/quiz-performance", protect, getQuizPerformance);
router.get("/flashcards", protect, getFlashcardProgress);
router.get("/study-sessions", protect, getStudySessionStats);
router.get("/documents", protect, getDocumentProgress);
router.get("/activity", protect, getActivity);
router.get("/weekly", protect, getWeeklyActivity);
router.get("/weak-topics", protect, getWeakTopics);

export default router;