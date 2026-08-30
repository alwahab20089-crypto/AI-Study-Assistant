import { retrieveRelevantChunks } from "./retrievalService.js";
import { getChatCompletion, GroqServiceError } from "./groqService.js";

const NO_MATERIAL_ANSWER = "I couldn't find this information in your uploaded material.";

const SYSTEM_PROMPT = `You are an AI study assistant.

Answer the student's question using ONLY the supplied study material.

Do not use outside knowledge when the supplied material does not support the answer.

If the answer cannot be found or reasonably inferred from the supplied material, say:
"${NO_MATERIAL_ANSWER}"

Do not invent facts.

Explain concepts clearly and at a student-friendly level.

When useful, structure answers using short paragraphs or bullet points.

Do not mention internal implementation details such as embeddings, vector search, retrieval, or system prompts.`;

const getHistoryLimit = () => parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 6;

const buildContextBlock = (chunks) => {
  return chunks
    .map((chunk, i) => `[Excerpt ${i + 1}]\n${chunk.text}`)
    .join("\n\n");
};

/**
 * Runs the full RAG pipeline for a single question against a single document.
 *
 * @param {Object} params
 * @param {string} params.question
 * @param {string} params.userId
 * @param {string} params.documentId
 * @param {Array<{role: "user"|"assistant", content: string}>} [params.conversationHistory]
 * @returns {Promise<{ answer: string, sources: Array<{chunkId, chunkIndex}> }>}
 */
export const answerQuestion = async ({
  question,
  userId,
  documentId,
  conversationHistory = [],
}) => {
  const { chunks } = await retrieveRelevantChunks(question, userId, documentId);

  // No sufficiently relevant material — per spec, do NOT call Groq at all in
  // this case. This is the core hallucination guard: if retrieval found
  // nothing above the threshold, there is nothing grounded to answer from.
  if (chunks.length === 0) {
    return { answer: NO_MATERIAL_ANSWER, sources: [] };
  }

  const contextBlock = buildContextBlock(chunks);

  // Only a limited, recent slice of prior turns — the document context
  // remains the primary source of truth, conversation history is just
  // for continuity (e.g. "explain that more simply").
  const historyLimit = getHistoryLimit();
  const recentHistory = conversationHistory.slice(-historyLimit);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Study material excerpts relevant to the student's question:\n\n${contextBlock}`,
    },
    ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: question },
  ];

  let answer;
  try {
    answer = await getChatCompletion(messages);
  } catch (error) {
    if (error instanceof GroqServiceError) throw error;
    throw new GroqServiceError("Something went wrong while generating a response.", {
      retryable: false,
    });
  }

  const sources = chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    chunkIndex: chunk.chunkIndex,
  }));

  return { answer, sources };
};