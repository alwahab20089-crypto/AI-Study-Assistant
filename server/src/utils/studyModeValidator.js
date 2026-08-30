const VALID_CORRECTNESS = ["correct", "partial", "incorrect"];

/**
 * Validates the AI's response when generating the FIRST question of a
 * study session. Returns { valid: true } or { valid: false, reason }.
 */
export const validateQuestionResponse = (data) => {
  if (!data || typeof data !== "object") {
    return { valid: false, reason: "Response was not a valid object" };
  }

  if (typeof data.question !== "string" || !data.question.trim()) {
    return { valid: false, reason: "Missing or invalid question" };
  }

  if (data.topic !== undefined && typeof data.topic !== "string") {
    return { valid: false, reason: "topic must be a string" };
  }

  return { valid: true };
};

/**
 * Validates the AI's combined evaluation (+ optional next question)
 * response returned after the student submits an answer.
 *
 * @param {*} data
 * @param {{ requireNextQuestion?: boolean, recentQuestions?: string[] }} options
 */
export const validateEvaluationResponse = (
  data,
  { requireNextQuestion = false, recentQuestions = [] } = {}
) => {
  if (!data || typeof data !== "object") {
    return { valid: false, reason: "Response was not a valid object" };
  }

  if (!VALID_CORRECTNESS.includes(data.correctness)) {
    return {
      valid: false,
      reason: 'correctness must be "correct", "partial", or "incorrect"',
    };
  }

  if (typeof data.feedback !== "string" || !data.feedback.trim()) {
    return { valid: false, reason: "Missing or invalid feedback" };
  }

  if (typeof data.explanation !== "string" || !data.explanation.trim()) {
    return { valid: false, reason: "Missing or invalid explanation" };
  }

  if (requireNextQuestion) {
    if (typeof data.nextQuestion !== "string" || !data.nextQuestion.trim()) {
      return { valid: false, reason: "Missing or invalid nextQuestion" };
    }

    if (data.nextTopic !== undefined && typeof data.nextTopic !== "string") {
      return { valid: false, reason: "nextTopic must be a string" };
    }

    const normalized = data.nextQuestion.trim().toLowerCase();
    const isDuplicate = recentQuestions.some(
      (q) => q.trim().toLowerCase() === normalized
    );

    if (isDuplicate) {
      return {
        valid: false,
        reason: "nextQuestion duplicates a recently asked question",
      };
    }
  }

  return { valid: true };
};