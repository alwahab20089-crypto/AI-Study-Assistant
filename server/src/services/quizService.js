import DocumentChunk from "../models/DocumentChunk.js";
import { getChatCompletion } from "./groqService.js";
import { validateQuizData } from "../utils/quizValidator.js";
import { generateEmbedding } from "./embeddingService.js";
import { cosineSimilarity } from "../utils/similarity.js";
import { MAX_TOPIC_LENGTH } from "../constants/weakTopicConstants.js";

const getMaxRetries = () =>
  parseInt(process.env.QUIZ_MAX_GENERATION_RETRIES, 10) || 1;

const TOPIC_CHUNK_SIMILARITY_THRESHOLD = 0.3;

/**
 * Select representative chunks spread across the entire document.
 *
 * @param {string} documentId
 * @param {number} targetSampleSize
 * @returns {Promise<string[]>}
 */
export const selectRepresentativeChunks = async (
  documentId,
  targetSampleSize = 12
) => {
  const allChunks = await DocumentChunk.find({
    document: documentId,
  })
    .sort({ chunkIndex: 1 })
    .select("chunkIndex text");

  if (allChunks.length <= targetSampleSize) {
    return allChunks.map((chunk) => chunk.text);
  }

  // Evenly sample chunks across the entire document.
  const step = allChunks.length / targetSampleSize;
  const sampled = [];
  const seenIndices = new Set();

  for (let i = 0; i < targetSampleSize; i++) {
    const index = Math.floor(i * step);

    if (!seenIndices.has(index)) {
      seenIndices.add(index);
      sampled.push(allChunks[index]);
    }
  }

  return sampled.map((chunk) => chunk.text);
};

/**
 * Selects document chunks most relevant to a specific topic, for generating
 * a topic-focused practice quiz (spec sections 21-23). Returns null when
 * nothing clears the similarity threshold so the caller can fall back to a
 * representative sample instead of failing outright.
 *
 * @param {string} documentId
 * @param {string} topic
 * @param {number} targetSampleSize
 * @returns {Promise<string[] | null>}
 */
export const selectTopicRelevantChunks = async (
  documentId,
  topic,
  targetSampleSize = 12
) => {
  const topicEmbedding = await generateEmbedding(topic);

  const allChunks = await DocumentChunk.find({ document: documentId }).select(
    "+embedding chunkIndex text"
  );

  const scored = allChunks
    .map((chunk) => ({
      text: chunk.text,
      similarity: cosineSimilarity(topicEmbedding, chunk.embedding),
    }))
    .filter((chunk) => chunk.similarity >= TOPIC_CHUNK_SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, targetSampleSize);

  if (scored.length === 0) return null;

  return scored.map((chunk) => chunk.text);
};

const DIFFICULTY_GUIDANCE = {
  easy:
    "Focus on definitions, direct facts, and basic understanding of the material.",

  medium:
    "Focus on relationships between concepts, understanding, and applying information from the material.",

  hard:
    "Focus on comparing concepts, reasoning from the material, applying concepts in less direct ways, and using more challenging but still fair and unambiguous incorrect options. Hard questions must still be answerable using only the provided material and must not require outside knowledge.",
};

/**
 * Builds the system prompt used for quiz generation.
 *
 * @param {number} questionCount
 * @param {"easy"|"medium"|"hard"} difficulty
 * @param {string|null} focusTopic
 * @returns {string}
 */
const buildQuizSystemPrompt = (questionCount, difficulty, focusTopic) => {
  return `You are an AI study assistant that creates multiple-choice questions from a student's uploaded study material.

Use ONLY the provided study material.

Do not use outside knowledge.

Every question must be answerable from the provided material.

Each question must have exactly one correct answer.

Create plausible incorrect options, but do not make them ambiguous. Exactly one option must be clearly correct based on the material.

Do not invent facts.

Difficulty: ${difficulty}. ${DIFFICULTY_GUIDANCE[difficulty]}

Generate exactly ${questionCount} questions.
${
  focusTopic
    ? `\nFocus every question specifically on this topic: "${focusTopic}". Still use only the provided material — if the material only partially covers this topic, generate the best questions you can from what is actually there.\n`
    : ""
}
Make questions useful for studying rather than trivial wording changes of the same fact repeated.

Vary which option position (1st, 2nd, 3rd, or 4th) holds the correct answer across questions.

Keep questions, options, and explanations concise so the complete quiz can fit within the response limit.

For each question, also provide a short "topic" label (2-6 words, e.g. "Cell Division") naming the specific concept the question tests, based only on the provided material. Keep it under ${MAX_TOPIC_LENGTH} characters.

Respond with ONLY valid JSON matching this structure:

{
  "title": "A short descriptive quiz title",
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": 0,
      "explanation": "...",
      "topic": "..."
    }
  ]
}

Rules:
- "options" must contain exactly 4 strings.
- "correctAnswer" must be 0, 1, 2, or 3.
- "correctAnswer" identifies the zero-based index of the correct option.
- "explanation" must briefly explain why the correct answer is supported by the material.
- "topic" must be a concise label for the specific concept being tested, under ${MAX_TOPIC_LENGTH} characters, and based only on the material.
- Do not include Markdown.
- Do not include code fences.
- Do not include any text outside the JSON object.`;
};

/**
 * Builds a correction prompt for retry attempts.
 *
 * @param {string} reason
 * @returns {string}
 */
const buildCorrectionPrompt = (reason) => {
  return `Your previous response did not meet the required format.

Problem:
${reason}

Generate the complete quiz again.

Strict requirements:
- Generate exactly the requested number of questions.
- Return ONLY valid JSON.
- Do not use Markdown or code fences.
- Do not add any text before or after the JSON.
- Each question must contain exactly 4 options.
- Each question must have exactly one correct answer.
- Each question must include a concise "topic" label under ${MAX_TOPIC_LENGTH} characters.
- Keep explanations concise.
- Use ONLY the provided study material.`;
};

/**
 * Requests one quiz generation and parses the JSON response.
 *
 * Groq is configured with JSON response mode, but JSON.parse is still
 * performed here as a final application-level safety check.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<Object>}
 */
const requestQuizGeneration = async (messages) => {
  const raw = await getChatCompletion(messages);

  if (!raw || typeof raw !== "string") {
    throw new Error("AI returned an empty response.");
  }

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(
      `AI response was not valid JSON: ${error.message}`
    );
  }
};

/**
 * Generates and validates a quiz from a document.
 *
 * The function:
 * 1. Selects representative document chunks (or topic-relevant chunks when
 *    a focusTopic is given, falling back to representative sampling).
 * 2. Sends them to Groq.
 * 3. Parses the JSON response.
 * 4. Validates the quiz structure/content.
 * 5. Retries if generation or validation fails.
 *
 * @param {string} documentId
 * @param {number} questionCount
 * @param {"easy"|"medium"|"hard"} difficulty
 * @param {string|null} focusTopic
 * @returns {Promise<{title: string, questions: Array}>}
 */
export const generateQuizContent = async (
  documentId,
  questionCount,
  difficulty,
  focusTopic = null
) => {
  // Sample more chunks for larger quizzes, capped at 20.
  const sampleSize = Math.min(
    20,
    Math.max(8, questionCount)
  );

  let chunkTexts = null;

  if (focusTopic) {
    chunkTexts = await selectTopicRelevantChunks(
      documentId,
      focusTopic,
      sampleSize
    );
  }

  if (!chunkTexts || chunkTexts.length === 0) {
    chunkTexts = await selectRepresentativeChunks(
      documentId,
      sampleSize
    );
  }

  if (chunkTexts.length === 0) {
    throw new Error(
      "This document has no processed content to generate a quiz from."
    );
  }

  const materialBlock = chunkTexts
    .map(
      (text, index) =>
        `[Excerpt ${index + 1}]\n${text}`
    )
    .join("\n\n");

  const systemPrompt = buildQuizSystemPrompt(
    questionCount,
    difficulty,
    focusTopic
  );

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `Study material:\n\n${materialBlock}`,
    },
  ];

  const maxRetries = getMaxRetries();
  let lastReason = "";

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt++
  ) {
    let parsed;

    try {
      parsed = await requestQuizGeneration(messages);
    } catch (error) {
      lastReason =
        error?.message ||
        "Unknown AI generation error.";

      if (attempt < maxRetries) {
        messages.push({
          role: "user",
          content: buildCorrectionPrompt(lastReason),
        });

        continue;
      }

      console.error(
        "Quiz generation failed:",
        lastReason
      );

      throw new Error(
        "We couldn't generate the quiz right now. Please try again."
      );
    }

    const validation = validateQuizData(
      parsed,
      questionCount
    );

    if (validation.valid) {
      return parsed;
    }

    lastReason =
      validation.reason ||
      "Generated quiz failed validation.";

    if (attempt < maxRetries) {
      messages.push({
        role: "user",
        content: buildCorrectionPrompt(lastReason),
      });

      continue;
    }
  }

  console.error(
    "Quiz validation failed after retries:",
    lastReason
  );

  throw new Error(
    "We couldn't generate the quiz right now. Please try again."
  );
};