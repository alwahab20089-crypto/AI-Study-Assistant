import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { generateQuiz, getQuiz, listQuizzes, submitQuiz } from "../controllers/quizController.js";

const router = express.Router();

router.post("/", protect, generateQuiz);
router.get("/", protect, listQuizzes);
router.get("/:quizId", protect, getQuiz);
router.post("/:quizId/submit", protect, submitQuiz);

export default router;