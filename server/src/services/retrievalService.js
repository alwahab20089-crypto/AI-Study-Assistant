import DocumentChunk from "../models/DocumentChunk.js";
import { generateEmbedding } from "./embeddingService.js";
import { cosineSimilarity } from "../utils/similarity.js";

const getConfig = () => ({
  topK: parseInt(process.env.RAG_TOP_K, 10) || 5,
  threshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD) ?? 0.35,
});

/**
 * Finds the most relevant chunks for a question, scoped to a single user's
 * single document. Only chunks above the similarity threshold are returned.
 *
 * @param {string} question
 * @param {string} userId - authenticated user's id (ownership enforced here)
 * @param {string} documentId - the document being chatted with
 * @returns {Promise<{ chunks: Array<{chunkId, chunkIndex, text, similarity}>, questionEmbedding: number[] }>}
 */
export const retrieveRelevantChunks = async (question, userId, documentId) => {
  const { topK, threshold } = getConfig();

  const questionEmbedding = await generateEmbedding(question);

  // Ownership enforced directly in the query — never trust anything but
  // the authenticated user's id. A chunk belonging to another user's
  // document simply cannot match this filter.
  const candidateChunks = await DocumentChunk.find({
    user: userId,
    document: documentId,
  }).select("+embedding chunkIndex text metadata");

  const scored = candidateChunks
    .map((chunk) => ({
      chunkId: chunk._id,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      metadata: chunk.metadata,
      similarity: cosineSimilarity(questionEmbedding, chunk.embedding),
    }))
    .filter((chunk) => chunk.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return { chunks: scored, questionEmbedding };
};