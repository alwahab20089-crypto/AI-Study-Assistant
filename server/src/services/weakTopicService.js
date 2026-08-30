import mongoose from "mongoose";
import QuizAttempt from "../models/QuizAttempt.js";
import StudyTurn from "../models/StudyTurn.js";
import {
  MIN_TOPIC_ATTEMPTS,
  WEAK_TOPIC_ACCURACY,
  RECENT_ATTEMPTS_LIMIT,
  OVERALL_WEIGHT,
  RECENT_WEIGHT,
  IMPROVEMENT_THRESHOLD,
} from "../constants/weakTopicConstants.js";

/**
 * Normalizes a topic label for grouping only (not for display) so that
 * "Cell Division", "cell division", and "CELL DIVISION" resolve to the
 * same topic (spec section 4).
 */
const normalizeTopicKey = (topic) => topic.trim().toLowerCase().replace(/\s+/g, " ");

// ---------------------------------------------------------------------
// Flat, per-answer records — one MongoDB aggregation per source collection,
// each already joined to document/subject, so grouping/scoring below never
// issues a query per topic (spec section 28).
// ---------------------------------------------------------------------

const getQuizAnswerRecords = async (uid) => {
  return QuizAttempt.aggregate([
    { $match: { user: uid } },
    { $lookup: { from: "quizzes", localField: "quiz", foreignField: "_id", as: "quizDoc" } },
    { $unwind: "$quizDoc" },
    { $unwind: "$answers" },
    {
      $addFields: {
        questionTopic: { $arrayElemAt: ["$quizDoc.questions.topic", "$answers.questionIndex"] },
      },
    },
    // Older quizzes generated before this phase have no topic — they are
    // simply excluded from weak-topic detection rather than breaking it
    // (spec section 25).
    { $match: { questionTopic: { $exists: true, $nin: [null, ""] } } },
    { $lookup: { from: "documents", localField: "document", foreignField: "_id", as: "docDoc" } },
    { $unwind: "$docDoc" },
    { $lookup: { from: "subjects", localField: "docDoc.subject", foreignField: "_id", as: "subjectDoc" } },
    { $unwind: { path: "$subjectDoc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        topic: "$questionTopic",
        correctness: { $cond: ["$answers.correct", "correct", "incorrect"] },
        documentId: "$docDoc._id",
        documentTitle: "$docDoc.title",
        subjectId: "$subjectDoc._id",
        subjectName: "$subjectDoc.name",
        createdAt: "$createdAt",
      },
    },
  ]);
};

const getStudyAnswerRecords = async (uid) => {
  return StudyTurn.aggregate([
    { $match: { user: uid, topic: { $exists: true, $nin: [null, ""] } } },
    { $lookup: { from: "studysessions", localField: "session", foreignField: "_id", as: "sessionDoc" } },
    { $unwind: "$sessionDoc" },
    { $lookup: { from: "documents", localField: "sessionDoc.document", foreignField: "_id", as: "docDoc" } },
    { $unwind: "$docDoc" },
    { $lookup: { from: "subjects", localField: "docDoc.subject", foreignField: "_id", as: "subjectDoc" } },
    { $unwind: { path: "$subjectDoc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        topic: "$topic",
        correctness: "$correctness", // already "correct" | "partial" | "incorrect"
        documentId: "$docDoc._id",
        documentTitle: "$docDoc.title",
        subjectId: "$subjectDoc._id",
        subjectName: "$subjectDoc.name",
        createdAt: "$createdAt",
      },
    },
  ]);
};

// ---------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------

const POINTS = { correct: 1, partial: 0.5, incorrect: 0 };

/**
 * Transparent accuracy calculation: correct = 1 point, partial = 0.5,
 * incorrect = 0 (spec section 9). Returns null only for an empty set.
 */
const summarize = (records) => {
  const total = records.length;
  const correct = records.filter((r) => r.correctness === "correct").length;
  const partial = records.filter((r) => r.correctness === "partial").length;
  const incorrect = records.filter((r) => r.correctness === "incorrect").length;
  const earnedPoints = correct * POINTS.correct + partial * POINTS.partial;
  const accuracy = total > 0 ? Math.round((earnedPoints / total) * 1000) / 10 : null;
  return { total, correct, partial, incorrect, accuracy };
};

// Picks the document most represented among a topic's records, so a topic
// spanning several documents still gets ONE reliable reference instead of
// an invented or arbitrary one (spec sections 14/15).
const pickPrimaryDocument = (records) => {
  const counts = new Map();
  for (const r of records) {
    if (!r.documentId) continue;
    const key = String(r.documentId);
    const entry = counts.get(key) || {
      count: 0,
      documentId: r.documentId,
      documentTitle: r.documentTitle,
      subjectId: r.subjectId || null,
      subjectName: r.subjectName || null,
    };
    entry.count += 1;
    counts.set(key, entry);
  }

  let best = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best;
};

// Picks the most common raw topic label for display, so normalization
// (used only for grouping) never leaks into what the student sees.
const pickDisplayTopic = (records) => {
  const counts = new Map();
  for (const r of records) {
    const label = r.topic.trim();
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  let best = null;
  let bestCount = 0;
  for (const [label, count] of counts.entries()) {
    if (count > bestCount) {
      best = label;
      bestCount = count;
    }
  }
  return best;
};

/**
 * Computes weak-topic and improved-topic breakdowns for one user, using
 * only measured quiz + study-mode evidence (no invented mastery scores,
 * no ML model — spec sections 5-7).
 *
 * Thresholds (all in constants/weakTopicConstants.js):
 * - MIN_TOPIC_ATTEMPTS combined answers are required before a topic is
 *   considered at all.
 * - "Overall accuracy" = correct points / total answers for that topic,
 *   across every quiz + study-mode answer ever recorded for it.
 * - "Recent accuracy" = the same calculation over only the most recent
 *   RECENT_ATTEMPTS_LIMIT answers for that topic (quiz + study mode
 *   combined, most recent first).
 * - Once there are at least MIN_TOPIC_ATTEMPTS recent answers, a combined
 *   score blends overall and recent accuracy (OVERALL_WEIGHT / RECENT_WEIGHT,
 *   recent weighted higher) so genuine recent improvement can lift a topic
 *   out of "review" status. Below that, overall accuracy is used alone.
 * - "review" is recommended when attempts >= MIN_TOPIC_ATTEMPTS AND the
 *   combined score is below WEAK_TOPIC_ACCURACY.
 * - A topic that used to cross that threshold on overall accuracy, but
 *   whose recent accuracy has since risen at least IMPROVEMENT_THRESHOLD
 *   points above it, is reported separately as "improved" instead.
 */
export const getWeakTopics = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [quizRecords, studyRecords] = await Promise.all([
    getQuizAnswerRecords(uid),
    getStudyAnswerRecords(uid),
  ]);

  const allRecords = [...quizRecords, ...studyRecords];

  const groups = new Map();
  for (const record of allRecords) {
    const key = normalizeTopicKey(record.topic);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  const weakTopics = [];
  const improvedTopics = [];

  for (const records of groups.values()) {
    if (records.length < MIN_TOPIC_ATTEMPTS) continue;

    const sortedByRecency = [...records].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const recentRecords = sortedByRecency.slice(0, RECENT_ATTEMPTS_LIMIT);

    const overall = summarize(records);
    const recent = summarize(recentRecords);

    const combinedScore =
      recent.total >= MIN_TOPIC_ATTEMPTS
        ? Math.round((OVERALL_WEIGHT * overall.accuracy + RECENT_WEIGHT * recent.accuracy) * 10) / 10
        : overall.accuracy;

    const primaryDoc = pickPrimaryDocument(records);
    const displayTopic = pickDisplayTopic(records);

    const base = {
      topic: displayTopic,
      subjectId: primaryDoc?.subjectId || null,
      subjectName: primaryDoc?.subjectName || null,
      documentId: primaryDoc?.documentId || null,
      documentTitle: primaryDoc?.documentTitle || null,
      attempts: overall.total,
      correct: overall.correct,
      incorrect: overall.incorrect,
      ...(overall.partial > 0 ? { partial: overall.partial } : {}),
      accuracy: overall.accuracy,
      recentAccuracy: recent.accuracy,
    };

    if (combinedScore < WEAK_TOPIC_ACCURACY) {
      weakTopics.push({ ...base, recommendation: "review" });
      continue;
    }

    const wasWeakOverall = overall.accuracy < WEAK_TOPIC_ACCURACY;
    const improvedEnough =
      recent.total >= MIN_TOPIC_ATTEMPTS && recent.accuracy - overall.accuracy >= IMPROVEMENT_THRESHOLD;

    if (wasWeakOverall && improvedEnough) {
      improvedTopics.push(base);
    }
  }

  // Worst-performing topics first.
  weakTopics.sort((a, b) => a.accuracy - b.accuracy);

  return { weakTopics, improvedTopics };
};