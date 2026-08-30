import { MAX_TOPIC_LENGTH } from "../constants/weakTopicConstants.js";

/**
 * Validates AI-generated quiz JSON against the structural and quality
 * rules from the spec. Returns { valid: true } or { valid: false, reason }
 * — never throws, so the caller can decide whether to retry.
 *
 * @param {*} data - parsed JSON from the AI response
 * @param {number} expectedQuestionCount
 * @returns {{ valid: boolean, reason?: string }}
 */
export const validateQuizData = (data, expectedQuestionCount) => {
  if (!data || typeof data !== "object") {
    return { valid: false, reason: "Response was not a valid object" };
  }

  if (typeof data.title !== "string" || !data.title.trim()) {
    return { valid: false, reason: "Missing or invalid title" };
  }

  if (!Array.isArray(data.questions)) {
    return { valid: false, reason: "Missing questions array" };
  }

  if (data.questions.length !== expectedQuestionCount) {
    return {
      valid: false,
      reason: `Expected ${expectedQuestionCount} questions, got ${data.questions.length}`,
    };
  }

  const seenQuestionTexts = new Set();

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    const label = `Question ${i + 1}`;

    if (!q || typeof q !== "object") {
      return { valid: false, reason: `${label}: not a valid object` };
    }

    if (typeof q.question !== "string" || !q.question.trim()) {
      return { valid: false, reason: `${label}: missing question text` };
    }

    // Duplicate question detection — normalized, case-insensitive comparison
    const normalized = q.question.trim().toLowerCase().replace(/\s+/g, " ");
    if (seenQuestionTexts.has(normalized)) {
      return { valid: false, reason: `${label}: duplicate question text` };
    }
    seenQuestionTexts.add(normalized);

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { valid: false, reason: `${label}: must have exactly 4 options` };
    }

    if (q.options.some((opt) => typeof opt !== "string" || !opt.trim())) {
      return { valid: false, reason: `${label}: contains an empty option` };
    }

    const normalizedOptions = q.options.map((opt) => opt.trim().toLowerCase());
    const uniqueOptions = new Set(normalizedOptions);
    if (uniqueOptions.size !== q.options.length) {
      return { valid: false, reason: `${label}: contains duplicate options` };
    }

    if (
      typeof q.correctAnswer !== "number" ||
      !Number.isInteger(q.correctAnswer) ||
      q.correctAnswer < 0 ||
      q.correctAnswer > 3
    ) {
      return { valid: false, reason: `${label}: correctAnswer must be an integer 0-3` };
    }

    if (typeof q.explanation !== "string" || !q.explanation.trim()) {
      return { valid: false, reason: `${label}: missing explanation` };
    }

    if (typeof q.topic !== "string" || !q.topic.trim()) {
      return { valid: false, reason: `${label}: missing topic` };
    }

    if (q.topic.trim().length > MAX_TOPIC_LENGTH) {
      return {
        valid: false,
        reason: `${label}: topic must be ${MAX_TOPIC_LENGTH} characters or fewer`,
      };
    }
  }

  // Answer-position distribution check (spec section 22) — reject if every
  // correct answer landed on the same option index, which is a strong signal
  // of a lazy/degenerate generation rather than genuine variation.
  if (data.questions.length >= 4) {
    const allSameIndex = data.questions.every(
      (q) => q.correctAnswer === data.questions[0].correctAnswer
    );
    if (allSameIndex) {
      return {
        valid: false,
        reason: "All correct answers landed on the same option position",
      };
    }
  }

  return { valid: true };
};