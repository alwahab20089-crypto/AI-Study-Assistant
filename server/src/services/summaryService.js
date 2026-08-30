import DocumentChunk from "../models/DocumentChunk.js";
import { getChatCompletion, GroqServiceError } from "./groqService.js";
const getBatchSize = () => parseInt(process.env.SUMMARY_CHUNK_BATCH_SIZE, 10) || 6;

export const WORD_LIMITS = {
  short: parseInt(process.env.SUMMARY_SHORT_WORD_LIMIT, 10) || 150,
  medium: parseInt(process.env.SUMMARY_MEDIUM_WORD_LIMIT, 10) || 350,
  detailed: parseInt(process.env.SUMMARY_DETAILED_WORD_LIMIT, 10) || 700,
};

/**
 * Fetches all chunks for a document, in original chunk order.
 * Ownership must already be verified by the caller (controller) before
 * this is called — this function trusts documentId as-is.
 * @param {string} documentId
 * @returns {Promise<Array<{chunkIndex: number, text: string}>>}
 */
export const getDocumentChunksInOrder = async (documentId) => {
  const chunks = await DocumentChunk.find({ document: documentId })
    .sort({ chunkIndex: 1 })
    .select("chunkIndex text");

  return chunks.map((c) => ({ chunkIndex: c.chunkIndex, text: c.text }));
};

/**
 * Groups an ordered list of chunks into batches of configurable size.
 * Batches preserve chunk order — this matters for producing a coherent
 * map→combine summary rather than one that jumps around the document.
 * @param {Array<{chunkIndex: number, text: string}>} chunks
 * @returns {string[][]} array of batches, each an array of chunk texts
 */
export const batchChunks = (chunks) => {
  const batchSize = getBatchSize();
  const batches = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize).map((c) => c.text);
    batches.push(batch);
  }

  return batches;
};
const PARTIAL_SUMMARY_SYSTEM_PROMPT = `You are an AI study assistant.

Your task is to summarize the student's uploaded study material.

Use ONLY the provided material.

Do not introduce facts that are not supported by the material.

Preserve important definitions, concepts, relationships, processes, formulas, and examples when they are present.

Do not change the meaning of the material.

Write in clear, student-friendly language.

Organize the summary so that it is easy to study.

If the supplied material is insufficient, summarize only what is actually available.

This is a partial summary of one section of a larger document — write it as a self-contained summary of just this section's content, without referring to "this section" or "this excerpt" explicitly.`;

/**
 * Summarizes a single batch of chunk texts into one partial summary.
 * This is the "map" step — called once per batch.
 * @param {string[]} batchTexts - chunk texts belonging to one batch
 * @returns {Promise<string>}
 */
const summarizeBatch = async (batchTexts) => {
  const combinedText = batchTexts.join("\n\n");

  const messages = [
    { role: "system", content: PARTIAL_SUMMARY_SYSTEM_PROMPT },
    { role: "user", content: `Study material:\n\n${combinedText}` },
  ];

  return getChatCompletion(messages);
};

/**
 * Runs the map step across all batches, producing one partial summary per batch.
 * Batches are processed sequentially (not in parallel) to stay conservative
 * with Groq's free-tier rate limits, per the spec's cost-control guidance.
 * @param {string[][]} batches
 * @returns {Promise<string[]>} partial summaries, in the same order as batches
 */
export const generatePartialSummaries = async (batches) => {
  const partialSummaries = [];

  for (const batch of batches) {
    const summary = await summarizeBatch(batch);
    partialSummaries.push(summary);
  }

  return partialSummaries;
};
const LENGTH_DESCRIPTIONS = {
  short: "Keep it concise — cover only the most essential points a student needs to know.",
  medium: "Cover the important details a student should understand, not just the highlights.",
  detailed: "Be thorough — cover the material in depth, preserving important nuance, examples, and steps.",
};

const buildCombineSystemPrompt = (length) => {
  const wordLimit = WORD_LIMITS[length];
  const lengthGuidance = LENGTH_DESCRIPTIONS[length];

  return `You are creating the final study summary from several partial summaries.

Combine them into one coherent summary.

Remove repetition.

Preserve important concepts.

Do not add outside information.

Do not invent missing facts.

Keep the summary faithful to the original study material.

Target length: approximately ${wordLimit} words. ${lengthGuidance}

Structure the summary for easy studying, using Markdown. Adapt the structure to what the material actually supports — do not force sections that don't fit. When appropriate, use headings such as:

# Overview
# Key Concepts
# Important Details
# Key Terms
# Quick Review

For technical or mathematical material, preserve formulas, equations, and important steps exactly as written rather than rewriting them into prose.`;
};

/**
 * Combines partial summaries into one coherent final summary at the
 * requested length. If there's only one partial summary (single-batch
 * document), this still runs — it reformats/resizes it to the target
 * length and structure rather than returning it unchanged.
 * @param {string[]} partialSummaries
 * @param {"short"|"medium"|"detailed"} length
 * @returns {Promise<string>}
 */
export const combineSummaries = async (partialSummaries, length) => {
  const systemPrompt = buildCombineSystemPrompt(length);
  const combinedPartials = partialSummaries
    .map((summary, i) => `[Partial Summary ${i + 1}]\n${summary}`)
    .join("\n\n");

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: combinedPartials },
  ];

  return getChatCompletion(messages);
};
/**
 * Runs the full map → combine pipeline for a document, producing one
 * final summary string at the requested length. Does not touch the
 * database — the caller is responsible for saving the result.
 * @param {string} documentId
 * @param {"short"|"medium"|"detailed"} length
 * @returns {Promise<string>}
 */
export const generateSummaryForDocument = async (documentId, length) => {
  const chunks = await getDocumentChunksInOrder(documentId);

  if (chunks.length === 0) {
    throw new Error("This document has no processed content to summarize.");
  }

  const batches = batchChunks(chunks);
  const partialSummaries = await generatePartialSummaries(batches);
  const finalSummary = await combineSummaries(partialSummaries, length);

  return finalSummary;
};