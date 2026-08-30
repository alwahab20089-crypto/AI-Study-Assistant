import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createStudySession,
  listStudySessions,
  getStudySession,
  submitStudyAnswer,
  abandonStudySession,
} from "../controllers/studySessionController.js";

const router = express.Router();

router.post("/", protect, createStudySession);
router.get("/", protect, listStudySessions);
router.get("/:sessionId", protect, getStudySession);
router.post("/:sessionId/answer", protect, submitStudyAnswer);
router.post("/:sessionId/abandon", protect, abandonStudySession);

export default router;