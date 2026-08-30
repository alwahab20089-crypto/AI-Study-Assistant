import StudyTurn from "../models/StudyTurn.js";
import { retrieveRelevantChunks } from "./retrievalService.js";
import { selectRepresentativeChunks } from "./quizService.js";
import { getChatCompletion, GroqServiceError } from "./groqService.js";
import {
  validateQuestionResponse,
  validateEvaluationResponse,
} from "../utils/studyModeValidator.js";

const getMaxRetries = () =>
  parseInt(process.env.STUDY_MODE_MAX_GENERATION_RETRIES, 10) || 1;

const RECENT_QUESTIONS_LIMIT = 4;
const FIRST_QUESTION_SAMPLE_SIZE = 12;
const FALLBACK_SAMPLE_SIZE = 8;

const TUTOR_SYSTEM_PROMPT = `You are an AI tutor helping a student study their uploaded material.

You must use ONLY the supplied study material.

Do not introduce facts from outside the material.

Your job is to teach interactively, one question at a time.

Do not reveal the answer before the student responds.

Questions should test understanding rather than memorization whenever the material allows it.

Keep questions clear, concise, and appropriate for a student.

Give encouraging, concise feedback. Do not shame or criticize the student.

Respond with ONLY valid JSON. Do not include Markdown, code fences, or any text outside the JSON object.`;

const DIFFICULTY_GUIDANCE = {
  easy: "Ask basic definitions, direct facts, and simple understanding questions.",
  medium:
    "Ask about concept relationships, explanations, and basic application of ideas.",
  hard: "Ask comparisons, reasoning, application of concepts, and multi-step understanding questions. Questions must still be answerable using only the supplied material.",
};

const MIXED_ADAPTATION_GUIDANCE = `This session uses "mixed" difficulty, which adapts based on performance:
- If the student's most recent answer was correct, make the next question slightly harder than the previous one.
- If the student's most recent answer was partially correct, ask a question at a similar difficulty that reinforces the same concept.
- If the student's most recent answer was incorrect, ask a simpler, reinforcement-style question about the same or a related concept.
Never make a sudden, large jump in difficulty.`;

const buildMaterialBlock = (texts) =>
  texts.map((text, i) => `[Excerpt ${i + 1}]\n${text}`).join("\n\n");

const buildCorrectionPrompt = (reason) => `Your previous response did not meet the required format.

Problem:
${reason}

Respond again.

Strict requirements:
- Return ONLY valid JSON.
- Do not use Markdown or code fences.
- Do not add any text before or after the JSON.
- Base your response only on the supplied study material.`;

/**
 * Sends messages to Groq expecting a JSON object, validates it, and retries
 * once (with a correction prompt) on a bad/invalid response. GroqServiceError
 * (rate limits, auth, timeouts, etc.) is NOT retried — it isn't a formatting
 * problem, so a correction prompt wouldn't help.
 */
const requestStructuredCompletion = async (
  messages,
  validateFn,
  completionOptions = {}
) => {
  const maxRetries = getMaxRetries();
  let lastReason = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let raw;

    try {
      raw = await getChatCompletion(messages, {
        json: true,
        ...completionOptions,
      });
    } catch (error) {
      if (error instanceof GroqServiceError) throw error;

      lastReason = error?.message || "Unknown AI error.";
      if (attempt < maxRetries) {
        messages.push({ role: "user", content: buildCorrectionPrompt(lastReason) });
        continue;
      }
      throw new Error("We couldn't evaluate your answer right now. Please try again.");
    }

    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      lastReason = `AI response was not valid JSON: ${error.message}`;
      if (attempt < maxRetries) {
        messages.push({ role: "user", content: buildCorrectionPrompt(lastReason) });
        continue;
      }
      break;
    }

    const validation = validateFn(parsed);
    if (validation.valid) return parsed;

    lastReason = validation.reason || "Response failed validation.";
    if (attempt < maxRetries) {
      messages.push({ role: "user", content: buildCorrectionPrompt(lastReason) });
      continue;
    }
  }

  console.error("Study mode AI generation failed:", lastReason);
  throw new Error("We couldn't evaluate your answer right now. Please try again.");
};

/**
 * Returns the last few question texts asked in this session, oldest first —
 * a small compact "context" the tutor uses to avoid repeating itself. We
 * read these back from StudyTurn instead of duplicating them onto
 * StudySession, so nothing extra is stored (spec section 4/36).
 */
const getRecentQuestions = async (sessionId) => {
  const turns = await StudyTurn.find({ session: sessionId })
    .sort({ createdAt: -1 })
    .limit(RECENT_QUESTIONS_LIMIT)
    .select("question");

  return turns.map((t) => t.question).reverse();
};

const buildFirstQuestionSystemPrompt = (difficulty) => `${TUTOR_SYSTEM_PROMPT}

Difficulty: ${difficulty}. ${
  difficulty === "mixed"
    ? "Start with a medium-difficulty question; this session's difficulty will adapt after each answer."
    : DIFFICULTY_GUIDANCE[difficulty]
}

This is the FIRST question of the study session. Choose an important concept from the study material and ask a single, clear question about it. Also give a short overall topic name for the material.

Respond with ONLY valid JSON matching this structure:
{
  "topic": "short topic name, e.g. Photosynthesis",
  "question": "the first tutor question"
}`;

/**
 * Generates the opening question for a brand-new study session, grounded in
 * a representative spread of the document's chunks (reusing the same
 * sampling used for quiz generation — no new embedding logic needed).
 */
export const generateFirstQuestion = async ({ documentId, difficulty }) => {
  const chunkTexts = await selectRepresentativeChunks(
    documentId,
    FIRST_QUESTION_SAMPLE_SIZE
  );

  if (chunkTexts.length === 0) {
    throw new Error("This document has no processed content to study from.");
  }

  const materialBlock = buildMaterialBlock(chunkTexts);
  const systemPrompt = buildFirstQuestionSystemPrompt(difficulty);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Study material:\n\n${materialBlock}` },
  ];

  return requestStructuredCompletion(messages, validateQuestionResponse, {
    temperature: 0.3,
    max_completion_tokens: 500,
  });
};

const buildEvaluationSystemPrompt = ({ difficulty, needNextQuestion }) => `${TUTOR_SYSTEM_PROMPT}

Difficulty: ${difficulty}. ${
  difficulty === "mixed" ? MIXED_ADAPTATION_GUIDANCE : DIFFICULTY_GUIDANCE[difficulty]
}

Evaluate whether the student's answer is "correct", "partial", or "incorrect", based only on the supplied material.

${
  needNextQuestion
    ? "After evaluating, generate the next tutor question. Prefer covering a different aspect of the material than the recently asked questions listed below, while staying within the uploaded material."
    : "This was the final question of the session — do NOT generate another question."
}

Respond with ONLY valid JSON matching this structure:
{
  "correctness": "correct" | "partial" | "incorrect",
  "feedback": "short, encouraging feedback for the student",
  "explanation": "the correct concept, stated clearly, grounded in the material"${
    needNextQuestion
      ? `,
  "nextQuestion": "the next tutor question",
  "nextTopic": "short topic name for the next question"`
      : ""
  }
}`;

const buildEvaluationUserMessage = ({
  materialBlock,
  recentQuestions,
  currentQuestion,
  studentAnswer,
}) => {
  const recentBlock = recentQuestions.length
    ? `\n\nRecently asked questions (avoid repeating these or near-duplicates):\n${recentQuestions
        .map((q, i) => `${i + 1}. ${q}`)
        .join("\n")}`
    : "";

  return `Study material excerpts:\n\n${materialBlock}${recentBlock}\n\nCurrent question:\n${currentQuestion}\n\nStudent's answer:\n${studentAnswer}`;
};

/**
 * Evaluates the student's answer to the session's current question and
 * (unless this was the last question) generates the next one — combined
 * into a SINGLE Groq call to minimize API usage (spec section 35).
 */
export const evaluateAnswerAndGenerateNext = async ({
  session,
  currentQuestion,
  studentAnswer,
  needNextQuestion,
}) => {
  // Ground the evaluation in chunks relevant to the question just asked.
  const { chunks } = await retrieveRelevantChunks(
    currentQuestion,
    session.user,
    session.document
  );

  let materialTexts = chunks.map((c) => c.text);

  // Retrieval can come back empty for short/simple questions. Rather than
  // calling Groq with no material at all, fall back to a representative
  // sample of the document so the evaluation still has something grounded
  // to compare the answer against.
  if (materialTexts.length === 0) {
    materialTexts = await selectRepresentativeChunks(
      session.document,
      FALLBACK_SAMPLE_SIZE
    );
  }

  const materialBlock = buildMaterialBlock(materialTexts);
  const recentQuestions = await getRecentQuestions(session._id);

  const systemPrompt = buildEvaluationSystemPrompt({
    difficulty: session.difficulty,
    needNextQuestion,
  });

  const userMessage = buildEvaluationUserMessage({
    materialBlock,
    recentQuestions,
    currentQuestion,
    studentAnswer,
  });

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  return requestStructuredCompletion(
    messages,
    (data) =>
      validateEvaluationResponse(data, {
        requireNextQuestion: needNextQuestion,
        recentQuestions,
      }),
    { temperature: 0.2, max_completion_tokens: 700 }
  );
};