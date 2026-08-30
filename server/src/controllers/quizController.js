import mongoose from "mongoose";
import Document from "../models/Document.js";
import Quiz from "../models/Quiz.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateQuizContent } from "../services/quizService.js";
import { GroqServiceError } from "../services/groqService.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { MAX_TOPIC_LENGTH } from "../constants/weakTopicConstants.js";

const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

const getQuestionBounds = () => ({
  min: parseInt(process.env.QUIZ_MIN_QUESTIONS, 10) || 5,
  max: parseInt(process.env.QUIZ_MAX_QUESTIONS, 10) || 20,
});

// Remove backend-only fields before sending quiz questions
// to the frontend while taking the quiz.
const sanitizeQuestionsForDelivery = (questions) => {
  return questions.map((q) => ({
    id: q._id,
    question: q.question,
    options: q.options,
  }));
};

// @desc   Generate a quiz from a document
// @route  POST /api/quizzes
// @access Private
export const generateQuiz = asyncHandler(async (req, res) => {
  const { documentId, questionCount, difficulty, topic } = req.body;
  const { min, max } = getQuestionBounds();

  if (!documentId || !mongoose.isValidObjectId(documentId)) {
    return res.status(400).json({
      success: false,
      message: "A valid documentId is required",
    });
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: "Difficulty must be one of: easy, medium, hard",
    });
  }

  const count = parseInt(questionCount, 10);

  if (!Number.isInteger(count) || count < min || count > max) {
    return res.status(400).json({
      success: false,
      message: `Number of questions must be between ${min} and ${max}`,
    });
  }

  // Optional topic focus, e.g. from a "Practice Quiz" action on a weak
  // topic (spec sections 21-22). Grounding still goes through the existing
  // RAG/document retrieval — this only biases which chunks are sampled.
  let focusTopic = null;
  if (topic !== undefined && topic !== null && topic !== "") {
    if (typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "topic must be a non-empty string",
      });
    }
    focusTopic = topic.trim().slice(0, MAX_TOPIC_LENGTH);
  }

  const document = await Document.findOne({
    _id: documentId,
    user: req.user._id,
  }).select("processingStatus title");

  if (!document) {
    return res.status(404).json({
      success: false,
      message: "Document not found",
    });
  }

  if (document.processingStatus === "processing") {
    return res.status(409).json({
      success: false,
      message:
        "This document is still being processed. Please try again shortly.",
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
    generated = await generateQuizContent(
      documentId,
      count,
      difficulty,
      focusTopic
    );
  } catch (error) {
    if (error instanceof GroqServiceError) {
      return res.status(error.status || 502).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Quiz generation failed:", error);

    return res.status(500).json({
      success: false,
      message:
        "We couldn't generate the quiz right now. Please try again.",
    });
  }

  // Defensive normalization/truncation in case the AI response drifts
  // from the validator's cap (spec section 4 — keep topics concise).
  const questions = generated.questions.map((q) => ({
    ...q,
    topic:
      typeof q.topic === "string"
        ? q.topic.trim().replace(/\s+/g, " ").slice(0, MAX_TOPIC_LENGTH)
        : "",
  }));

  const quiz = await Quiz.create({
    user: req.user._id,
    document: documentId,
    title: generated.title,
    difficulty,
    questionCount: count,
    questions,
  });

  return res.status(201).json({
    success: true,
    quiz: {
      id: quiz._id,
      title: quiz.title,
      difficulty: quiz.difficulty,
      questionCount: quiz.questionCount,
      questions: sanitizeQuestionsForDelivery(quiz.questions),
      createdAt: quiz.createdAt,
    },
  });
});

// @desc   Get a single quiz for the student to take
// @route  GET /api/quizzes/:quizId
// @access Private
export const getQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  if (!mongoose.isValidObjectId(quizId)) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  const quiz = await Quiz.findOne({
    _id: quizId,
    user: req.user._id,
  });

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  return res.status(200).json({
    success: true,
    quiz: {
      id: quiz._id,
      documentId: quiz.document,
      title: quiz.title,
      difficulty: quiz.difficulty,
      questionCount: quiz.questionCount,
      questions: sanitizeQuestionsForDelivery(quiz.questions),
      createdAt: quiz.createdAt,
    },
  });
});

// @desc   List the authenticated user's quizzes
// @route  GET /api/quizzes?documentId=...
// @access Private
export const listQuizzes = asyncHandler(async (req, res) => {
  const { documentId } = req.query;

  const filter = {
    user: req.user._id,
  };

  if (documentId) {
    if (!mongoose.isValidObjectId(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid documentId",
      });
    }

    filter.document = documentId;
  }

  const quizzes = await Quiz.find(filter)
    .sort({ createdAt: -1 })
    .select("title difficulty questionCount document createdAt")
    .populate("document", "title");

  const quizzesWithAttempts = await Promise.all(
    quizzes.map(async (quiz) => {
      const latestAttempt = await QuizAttempt.findOne({
        quiz: quiz._id,
        user: req.user._id,
      })
        .sort({ createdAt: -1 })
        .select("percentage completedAt");

      return {
        id: quiz._id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        questionCount: quiz.questionCount,
        document: {
          id: quiz.document?._id,
          title: quiz.document?.title,
        },
        createdAt: quiz.createdAt,
        latestAttempt: latestAttempt
          ? {
              percentage: latestAttempt.percentage,
              completedAt: latestAttempt.completedAt,
            }
          : null,
      };
    })
  );

  return res.status(200).json({
    success: true,
    quizzes: quizzesWithAttempts,
  });
});

// @desc   Submit answers for a quiz, score and save the attempt
// @route  POST /api/quizzes/:quizId/submit
// @access Private
export const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;

  if (!mongoose.isValidObjectId(quizId)) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  if (!Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      message: "Answers must be an array",
    });
  }

  // Explicitly include correctAnswer because it is hidden by default.
  const quiz = await Quiz.findOne({
    _id: quizId,
    user: req.user._id,
  }).select("+questions.correctAnswer");

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  if (answers.length !== quiz.questions.length) {
    return res.status(400).json({
      success: false,
      message: `Expected ${quiz.questions.length} answers, received ${answers.length}`,
    });
  }

  const invalidAnswer = answers.some(
    (answer) =>
      !Number.isInteger(answer) ||
      answer < -1 ||
      answer > 3
  );

  if (invalidAnswer) {
    return res.status(400).json({
      success: false,
      message:
        "Each answer must be an integer from 0 to 3 (or -1 if unanswered)",
    });
  }

  // Score every question on the backend.
  const scoredAnswers = quiz.questions.map((question, index) => {
    const selectedAnswer = answers[index];

    const correct =
      selectedAnswer === question.correctAnswer;

    return {
      questionIndex: index,
      selectedAnswer,
      correct,
    };
  });

  const score = scoredAnswers.filter(
    (answer) => answer.correct
  ).length;

  const totalQuestions = quiz.questions.length;

  const percentage = Math.round(
    (score / totalQuestions) * 100
  );

  const completedAt = new Date();

  const attempt = await QuizAttempt.create({
    user: req.user._id,
    quiz: quiz._id,
    document: quiz.document,
    answers: scoredAnswers,
    score,
    totalQuestions,
    percentage,
    startedAt: completedAt,
    completedAt,
  });

  // Build review data for the frontend.
  const review = quiz.questions.map((question, index) => ({
    question: question.question,
    options: question.options,
    correctAnswer: question.correctAnswer,
    selectedAnswer: answers[index],
    correct: scoredAnswers[index].correct,
    explanation: question.explanation,
    topic: question.topic || "",
  }));

  // IMPORTANT:
  // Only ONE response is sent.
  return res.status(201).json({
    success: true,

    result: {
      attemptId: attempt._id,
      score,
      totalQuestions,
      percentage,
      correct: score,
      incorrect: totalQuestions - score,
    },

    review,
  });
});