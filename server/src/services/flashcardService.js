import DocumentChunk from "../models/DocumentChunk.js";
import { getChatCompletion } from "./groqService.js";
import { validateFlashcardData } from "../utils/flashcardValidator.js";

const getMaxRetries = () =>
  parseInt(process.env.FLASHCARD_MAX_GENERATION_RETRIES, 10) || 1;

/**
 * Guidance for each flashcard difficulty level.
 */
const DIFFICULTY_GUIDANCE = {
  easy: `
Focus on basic definitions, key facts, terminology, and straightforward concepts.
Questions should test recall and basic understanding.
Avoid tricky wording or multi-step reasoning.
`,

  medium: `
Focus on understanding, relationships between concepts, processes, and practical application.
Questions may require comparison, explanation, or some reasoning.
Do not rely on knowledge outside the provided study material.
`,

  hard: `
Focus on deeper understanding, application, analysis, distinctions between related concepts,
and multi-step reasoning based strictly on the provided study material.
Do not introduce information that cannot be supported by the material.
`,

  mixed: `
Use a mixture of easy, medium, and hard questions.
Include basic recall questions as well as questions requiring understanding,
application, comparison, and deeper reasoning.
Keep the difficulty varied across the flashcard set.
`,
};

/**
 * Selects a representative spread of chunks across the whole document,
 * returning both the chunk id and text so generated cards can be traced
 * back to their source chunks.
 *
 * @param {string} documentId
 * @param {number} targetSampleSize
 * @returns {Promise<Array<{chunkId: string, text: string}>>}
 */
export const selectRepresentativeChunks = async (
  documentId,
  targetSampleSize = 12
) => {
  const allChunks = await DocumentChunk.find({ document: documentId })
    .sort({ chunkIndex: 1 })
    .select("chunkIndex text");

  const toResult = (chunks) =>
    chunks.map((c) => ({
      chunkId: c._id,
      text: c.text,
    }));

  if (allChunks.length <= targetSampleSize) {
    return toResult(allChunks);
  }

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

  return toResult(sampled);
};

/**
 * Builds the system prompt used for flashcard generation.
 *
 * @param {number} cardCount
 * @param {"easy"|"medium"|"hard"|"mixed"} difficulty
 * @returns {string}
 */
const buildFlashcardSystemPrompt = (cardCount, difficulty) => {
  const difficultyGuidance =
    DIFFICULTY_GUIDANCE[difficulty] || DIFFICULTY_GUIDANCE.mixed;

  return `You are an AI study assistant that creates flashcards from a student's uploaded study material.

Use ONLY the provided study material.

Do not use outside knowledge.

Every flashcard must be answerable from the supplied material.

Create useful study questions rather than trivial questions.

Avoid meaningless questions like:
"What does the document say about X?"

Instead, ask real, specific study questions.

Focus on important concepts, definitions, processes, relationships, formulas, terminology, and important facts.

Do not invent information.

Keep answers concise but sufficient for studying.
Answers should be informative and should not simply restate the question.

Difficulty: ${difficulty}.

${difficultyGuidance}

Generate exactly ${cardCount} flashcards.

Cover different concepts from the material rather than repeating the same idea.

The study material is provided as numbered excerpts:
Excerpt 1, Excerpt 2, Excerpt 3, etc.

For each flashcard, include which excerpt number(s) the card's content was drawn from.

Important rules:

1. Use ONLY information contained in the provided study material.
2. Do NOT use outside knowledge.
3. Generate exactly ${cardCount} cards.
4. Do NOT duplicate the same question or concept unnecessarily.
5. Keep questions clear and useful for studying.
6. Keep answers concise but informative.
7. Every card must include an excerptNumbers array.
8. excerptNumbers must contain valid excerpt numbers from the provided material.
9. Return ONLY valid JSON.
10. Do not include Markdown code fences.
11. Do not include explanations before or after the JSON.

Respond in exactly this structure:

{
  "title": "A short descriptive title for this flashcard set",
  "cards": [
    {
      "front": "A question, term, or prompt",
      "back": "The answer or explanation",
      "excerptNumbers": [1]
    }
  ]
}

"excerptNumbers" must be an array containing the excerpt number(s) that the card's content came from.

Example:

{
  "title": "Introduction to Computer Networks",
  "cards": [
    {
      "front": "What is a computer network?",
      "back": "A computer network is a group of interconnected computers and devices that communicate and share resources.",
      "excerptNumbers": [1, 2]
    }
  ]
}`;
};

/**
 * Builds a correction prompt when the AI response fails validation.
 *
 * @param {string} reason
 * @returns {string}
 */
const buildCorrectionPrompt = (reason) => {
  return `Your previous response did not meet the required format or validation rules.

Problem:
${reason}

Generate the flashcards again.

Follow ALL of the original instructions.

Requirements:
- Return ONLY valid JSON.
- Do not use Markdown code fences.
- Generate exactly the requested number of flashcards.
- Each card must contain "front", "back", and "excerptNumbers".
- "excerptNumbers" must be an array.
- Use only information from the provided study material.
- Do not add outside knowledge.
- Do not add explanations outside the JSON.

Return ONLY the corrected JSON.`;
};

/**
 * Requests flashcard generation from the Groq service
 * and parses the returned JSON.
 *
 * @param {Array} messages
 * @returns {Promise<Object>}
 */
const requestFlashcardGeneration = async (messages) => {
  const raw = await getChatCompletion(messages);

  if (!raw || typeof raw !== "string") {
    throw new Error("AI returned an empty response");
  }

  // Remove Markdown code fences if the model accidentally adds them.
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse flashcard JSON:", error);
    console.error("Raw AI response:", raw);

    throw new Error("AI response was not valid JSON");
  }
};

/**
 * Generates a validated flashcard set from a document's content.
 *
 * Each generated card is tagged with its source chunk IDs.
 *
 * Retries when the AI response fails JSON parsing or validation.
 *
 * Does not write anything to the database.
 *
 * @param {string} documentId
 * @param {number} cardCount
 * @param {"easy"|"medium"|"hard"|"mixed"} difficulty
 * @returns {Promise<{title: string, cards: Array}>}
 */
export const generateFlashcardContent = async (
  documentId,
  cardCount,
  difficulty
) => {
  const sampleSize = Math.min(20, Math.max(8, cardCount));

  const sampledChunks = await selectRepresentativeChunks(
    documentId,
    sampleSize
  );

  if (sampledChunks.length === 0) {
    throw new Error(
      "This document has no processed content to generate flashcards from."
    );
  }

  // Excerpt numbers are 1-based and map directly to sampledChunks' order.
  const materialBlock = sampledChunks
    .map((chunk, i) => `[Excerpt ${i + 1}]\n${chunk.text}`)
    .join("\n\n");

  const systemPrompt = buildFlashcardSystemPrompt(
    cardCount,
    difficulty
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

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let parsed;

    try {
      parsed = await requestFlashcardGeneration(messages);
    } catch (error) {
      lastReason = error.message;

      console.error(
        `Flashcard generation attempt ${attempt + 1} failed:`,
        error.message
      );

      if (attempt < maxRetries) {
        messages.push({
          role: "user",
          content: buildCorrectionPrompt(lastReason),
        });

        continue;
      }

      throw new Error(
        "We couldn't generate flashcards right now. Please try again."
      );
    }

    const { valid, reason } = validateFlashcardData(
      parsed,
      cardCount
    );

    if (valid) {
      /**
       * Map excerptNumbers (1-based) into sampledChunks
       * to get the real MongoDB ObjectIds.
       *
       * Invalid/out-of-range excerpt numbers are dropped.
       * Source chunks are enrichment and do not affect
       * flashcard correctness.
       */
      const cardsWithSources = parsed.cards.map((card) => {
        const excerptNumbers = Array.isArray(card.excerptNumbers)
          ? card.excerptNumbers
          : [];

        const sourceChunks = excerptNumbers
          .map((n) => sampledChunks[n - 1]?.chunkId)
          .filter(Boolean);

        return {
          front: card.front,
          back: card.back,
          sourceChunks,
        };
      });

      return {
        title: parsed.title,
        cards: cardsWithSources,
      };
    }

    lastReason = reason;

    console.error(
      `Flashcard validation failed on attempt ${attempt + 1}:`,
      reason
    );

    if (attempt < maxRetries) {
      messages.push({
        role: "user",
        content: buildCorrectionPrompt(reason),
      });

      continue;
    }
  }

  console.error(
    `Flashcard generation failed validation after retries: ${lastReason}`
  );

  throw new Error(
    "We couldn't generate flashcards right now. Please try again."
  );
};


