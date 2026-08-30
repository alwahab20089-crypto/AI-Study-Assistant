import mongoose from "mongoose";
import Document from "../models/Document.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import FlashcardProgress from "../models/FlashcardProgress.js";
import StudySession from "../models/StudySession.js";
import Summary from "../models/Summary.js";

const HISTORY_LIMIT = 30;
const WEEK_DAYS = 7;
const ACTIVITY_FETCH_LIMIT = 10;

// ---------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------

export const getOverview = async (userId) => {
  const [
    totalDocuments,
    totalQuizzes,
    totalQuizAttempts,
    totalStudySessions,
    totalFlashcardsReviewed,
    scoreAgg,
  ] = await Promise.all([
    Document.countDocuments({ user: userId }),
    Quiz.countDocuments({ user: userId }),
    QuizAttempt.countDocuments({ user: userId }),
    StudySession.countDocuments({ user: userId }),
    FlashcardProgress.countDocuments({ user: userId }),
    QuizAttempt.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, avg: { $avg: "$percentage" } } },
    ]),
  ]);

  return {
    totalDocuments,
    totalQuizzes,
    totalQuizAttempts,
    totalStudySessions,
    totalFlashcardsReviewed,
    averageQuizScore: scoreAgg.length > 0 ? Math.round(scoreAgg[0].avg) : null,
  };
};

// ---------------------------------------------------------------------
// Quiz performance
// ---------------------------------------------------------------------

export const getQuizPerformance = async (userId) => {
  const [stats, attempts] = await Promise.all([
    QuizAttempt.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$percentage" },
          highestScore: { $max: "$percentage" },
          lowestScore: { $min: "$percentage" },
          totalAttempts: { $sum: 1 },
        },
      },
    ]),
    QuizAttempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .select("percentage quiz completedAt")
      .lean(),
  ]);

  const performance =
    stats.length > 0
      ? {
          averageScore: Math.round(stats[0].averageScore),
          highestScore: stats[0].highestScore,
          lowestScore: stats[0].lowestScore,
          totalAttempts: stats[0].totalAttempts,
        }
      : { averageScore: null, highestScore: null, lowestScore: null, totalAttempts: 0 };

  // Oldest-first so a line chart reads left-to-right chronologically.
  const history = attempts
    .map((a) => ({ date: a.completedAt, score: a.percentage, quizId: a.quiz }))
    .reverse();

  return { performance, history };
};

// ---------------------------------------------------------------------
// Flashcard progress
// ---------------------------------------------------------------------

export const getFlashcardProgress = async (userId) => {
  const [totalReviewed, known, needReview] = await Promise.all([
    FlashcardProgress.countDocuments({ user: userId }),
    FlashcardProgress.countDocuments({ user: userId, status: "known" }),
    FlashcardProgress.countDocuments({ user: userId, status: "review" }),
  ]);

  return { totalReviewed, known, needReview };
};

// ---------------------------------------------------------------------
// Study session stats
// ---------------------------------------------------------------------

export const getStudySessionStats = async (userId) => {
  const [totalSessions, completedSessions, agg] = await Promise.all([
    StudySession.countDocuments({ user: userId }),
    StudySession.countDocuments({ user: userId, status: "completed" }),
    StudySession.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: "$questionsAsked" },
          correctAnswers: { $sum: "$questionsCorrect" },
          partialAnswers: { $sum: "$questionsPartiallyCorrect" },
          incorrectAnswers: { $sum: "$questionsIncorrect" },
        },
      },
    ]),
  ]);

  const totals =
    agg.length > 0
      ? agg[0]
      : { totalQuestions: 0, correctAnswers: 0, partialAnswers: 0, incorrectAnswers: 0 };

  const averageAccuracy =
    totals.totalQuestions > 0
      ? Math.round((totals.correctAnswers / totals.totalQuestions) * 100)
      : null;

  return {
    totalSessions,
    completedSessions,
    totalQuestions: totals.totalQuestions,
    correctAnswers: totals.correctAnswers,
    partialAnswers: totals.partialAnswers,
    incorrectAnswers: totals.incorrectAnswers,
    averageAccuracy,
  };
};

// ---------------------------------------------------------------------
// Document progress
//
// "Study Activity" is a transparent, capped blend of three raw counts —
// explicitly NOT a knowledge/mastery score (spec section 34). Each input
// is capped before weighting so no single activity type alone reaches 100%.
// ---------------------------------------------------------------------

const ACTIVITY_WEIGHTS = { quiz: 40, session: 30, flashcards: 30 };
const ACTIVITY_CAPS = { quizAttempts: 5, studySessions: 5, flashcardsReviewed: 50 };

const calculateStudyActivityPercent = ({ quizAttempts, studySessions, flashcardsReviewed }) => {
  const quizPart =
    (Math.min(quizAttempts, ACTIVITY_CAPS.quizAttempts) / ACTIVITY_CAPS.quizAttempts) *
    ACTIVITY_WEIGHTS.quiz;
  const sessionPart =
    (Math.min(studySessions, ACTIVITY_CAPS.studySessions) / ACTIVITY_CAPS.studySessions) *
    ACTIVITY_WEIGHTS.session;
  const flashcardPart =
    (Math.min(flashcardsReviewed, ACTIVITY_CAPS.flashcardsReviewed) /
      ACTIVITY_CAPS.flashcardsReviewed) *
    ACTIVITY_WEIGHTS.flashcards;

  return Math.round(quizPart + sessionPart + flashcardPart);
};

export const getDocumentProgress = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [documents, quizAgg, sessionAgg, flashcardAgg] = await Promise.all([
    Document.find({ user: userId }).select("title createdAt").sort({ createdAt: -1 }).lean(),

    QuizAttempt.aggregate([
      { $match: { user: uid } },
      {
        $group: {
          _id: "$document",
          quizAttempts: { $sum: 1 },
          averageQuizScore: { $avg: "$percentage" },
          lastQuizAt: { $max: "$createdAt" },
        },
      },
    ]),

    StudySession.aggregate([
      { $match: { user: uid } },
      {
        $group: {
          _id: "$document",
          studySessions: { $sum: 1 },
          lastSessionAt: { $max: "$createdAt" },
        },
      },
    ]),

    // FlashcardProgress has no document field directly — join through FlashcardSet.
    FlashcardProgress.aggregate([
      { $match: { user: uid } },
      {
        $lookup: {
          from: "flashcardsets",
          localField: "flashcardSet",
          foreignField: "_id",
          as: "set",
        },
      },
      { $unwind: "$set" },
      {
        $group: {
          _id: "$set.document",
          flashcardsReviewed: { $sum: 1 },
          lastFlashcardAt: { $max: "$reviewedAt" },
        },
      },
    ]),
  ]);

  const quizMap = new Map(quizAgg.map((row) => [String(row._id), row]));
  const sessionMap = new Map(sessionAgg.map((row) => [String(row._id), row]));
  const flashcardMap = new Map(flashcardAgg.map((row) => [String(row._id), row]));

  const result = documents.map((doc) => {
    const docId = String(doc._id);
    const quiz = quizMap.get(docId);
    const session = sessionMap.get(docId);
    const flashcard = flashcardMap.get(docId);

    const quizAttempts = quiz?.quizAttempts || 0;
    const averageQuizScore = quiz ? Math.round(quiz.averageQuizScore) : null;
    const studySessions = session?.studySessions || 0;
    const flashcardsReviewed = flashcard?.flashcardsReviewed || 0;

    const lastStudiedAt =
      [quiz?.lastQuizAt, session?.lastSessionAt, flashcard?.lastFlashcardAt]
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null;

    return {
      documentId: doc._id,
      title: doc.title,
      quizAttempts,
      averageQuizScore,
      studySessions,
      flashcardsReviewed,
      lastStudiedAt,
      studyActivityPercent: calculateStudyActivityPercent({
        quizAttempts,
        studySessions,
        flashcardsReviewed,
      }),
    };
  });

  result.sort((a, b) => {
    if (!a.lastStudiedAt && !b.lastStudiedAt) return 0;
    if (!a.lastStudiedAt) return 1;
    if (!b.lastStudiedAt) return -1;
    return new Date(b.lastStudiedAt) - new Date(a.lastStudiedAt);
  });

  return result;
};

// ---------------------------------------------------------------------
// Recent activity (aggregated from existing collections — no Activity model)
// ---------------------------------------------------------------------

export const getActivity = async (userId, limit = 10) => {
  const fetchLimit = Math.max(limit, ACTIVITY_FETCH_LIMIT);
  const uid = new mongoose.Types.ObjectId(userId);

  const [documents, quizAttempts, studySessions, summaries, flashcardBatches] = await Promise.all([
    Document.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .select("title createdAt")
      .lean(),

    QuizAttempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .select("percentage document createdAt")
      .populate("document", "title")
      .lean(),

    StudySession.find({ user: userId, status: "completed" })
      .sort({ completedAt: -1 })
      .limit(fetchLimit)
      .select("questionsAsked questionsCorrect document completedAt")
      .populate("document", "title")
      .lean(),

    Summary.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .select("length document createdAt")
      .populate("document", "title")
      .lean(),

    // Group individual card reviews into one activity per set per day,
    // rather than one entry per card (which would flood the timeline).
    FlashcardProgress.aggregate([
      { $match: { user: uid } },
      {
        $group: {
          _id: {
            flashcardSet: "$flashcardSet",
            day: { $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt", timezone: "UTC" } },
          },
          cardsReviewed: { $sum: 1 },
          lastReviewedAt: { $max: "$reviewedAt" },
        },
      },
      { $sort: { lastReviewedAt: -1 } },
      { $limit: fetchLimit },
      {
        $lookup: {
          from: "flashcardsets",
          localField: "_id.flashcardSet",
          foreignField: "_id",
          as: "set",
        },
      },
      { $unwind: "$set" },
      {
        $lookup: {
          from: "documents",
          localField: "set.document",
          foreignField: "_id",
          as: "doc",
        },
      },
      { $unwind: "$doc" },
    ]),
  ]);

  const activities = [
    ...documents.map((d) => ({
      type: "document_uploaded",
      documentTitle: d.title,
      createdAt: d.createdAt,
    })),
    ...quizAttempts.map((a) => ({
      type: "quiz_completed",
      documentTitle: a.document?.title || "Document",
      score: a.percentage,
      createdAt: a.createdAt,
    })),
    ...studySessions.map((s) => ({
      type: "study_session_completed",
      documentTitle: s.document?.title || "Document",
      questionsAsked: s.questionsAsked,
      questionsCorrect: s.questionsCorrect,
      createdAt: s.completedAt,
    })),
    ...summaries.map((sm) => ({
      type: "summary_generated",
      documentTitle: sm.document?.title || "Document",
      length: sm.length,
      createdAt: sm.createdAt,
    })),
    ...flashcardBatches.map((f) => ({
      type: "flashcards_reviewed",
      documentTitle: f.doc.title,
      cardsReviewed: f.cardsReviewed,
      createdAt: f.lastReviewedAt,
    })),
  ];

  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return activities.slice(0, limit);
};

// ---------------------------------------------------------------------
// Weekly activity (last 7 UTC calendar days, consistently server-side)
// ---------------------------------------------------------------------

const startOfUtcDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const getWeeklyActivity = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const today = startOfUtcDay(new Date());
  const rangeStart = new Date(today);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - (WEEK_DAYS - 1));

  const [quizByDay, flashcardsByDay, sessionsByDay] = await Promise.all([
    QuizAttempt.aggregate([
      { $match: { user: uid, createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
    ]),
    FlashcardProgress.aggregate([
      { $match: { user: uid, reviewedAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
    ]),
    StudySession.aggregate([
      { $match: { user: uid, createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const quizMap = new Map(quizByDay.map((r) => [r._id, r.count]));
  const flashcardMap = new Map(flashcardsByDay.map((r) => [r._id, r.count]));
  const sessionMap = new Map(sessionsByDay.map((r) => [r._id, r.count]));

  const days = [];
  for (let i = 0; i < WEEK_DAYS; i++) {
    const d = new Date(rangeStart);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);

    days.push({
      date: key,
      quizzes: quizMap.get(key) || 0,
      flashcards: flashcardMap.get(key) || 0,
      studySessions: sessionMap.get(key) || 0,
    });
  }

  return days;
};