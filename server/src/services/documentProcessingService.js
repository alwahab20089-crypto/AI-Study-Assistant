import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";
import { chunkText } from "./chunkingService.js";
import { generateEmbeddings } from "./embeddingService.js";

/**
 * Chunks a document's extracted text, generates embeddings, saves DocumentChunks,
 * and updates the document's processingStatus accordingly.
 * Safe to call again on the same document (clears old chunks first) so a
 * failed document can be reprocessed without leaving stale/duplicate chunks.
 * @param {string} documentId
 */
export const processDocument = async (documentId) => {
  const document = await Document.findById(documentId).select("+extractedText");

  if (!document) {
    throw new Error(`Document ${documentId} not found during processing`);
  }

  try {
    // Clear any existing chunks first — makes reprocessing idempotent rather
        // than appending duplicates on retry.
    await DocumentChunk.deleteMany({ document: document._id });

    const chunks = chunkText(document.extractedText);

    if (chunks.length === 0) {
      throw new Error("No chunks could be produced from the extracted text");
    }

    const embeddings = await generateEmbeddings(chunks);

    const chunkDocs = chunks.map((text, index) => ({
      document: document._id,
      user: document.user,
      chunkIndex: index,
      text,
      embedding: embeddings[index],
    }));

    await DocumentChunk.insertMany(chunkDocs);

    document.processingStatus = "ready";
    document.processingError = null;
    await document.save();

    return { success: true, chunkCount: chunks.length };
  } catch (error) {
    // Log full detail server-side only — never exposed to the user
    console.error(`Document processing failed for ${documentId}:`, error);

    document.processingStatus = "failed";
    document.processingError = error.message;
    await document.save();

    return { success: false, error: error.message };
  }
};