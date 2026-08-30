import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  generateFlashcards,
  getFlashcardSet,
  listFlashcardSets,
  submitFlashcardProgress,
  getFlashcardProgress,
} from "../controllers/flashcardController.js";

const router = express.Router();

router.post("/", protect, generateFlashcards);
router.get("/", protect, listFlashcardSets);
router.get("/:flashcardSetId", protect, getFlashcardSet);
router.post("/:flashcardSetId/progress", protect, submitFlashcardProgress);
router.get("/:flashcardSetId/progress", protect, getFlashcardProgress);

export default router;