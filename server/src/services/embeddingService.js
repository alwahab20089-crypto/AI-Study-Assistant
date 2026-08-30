import { pipeline } from "@huggingface/transformers";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

// Loaded once, reused for every embedding call — never reloaded per-request.
let extractorPromise = null;

const getExtractor = () => {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_NAME);
  }
  return extractorPromise;
};

/**
 * Generates a normalized 384-dimensional embedding for a single piece of text.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export const generateEmbedding = async (text) => {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};

/**
 * Generates embeddings for multiple texts in one batch call — more efficient
 * than calling generateEmbedding in a loop for document chunking.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export const generateEmbeddings = async (texts) => {
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: "mean", normalize: true });

  // output.dims = [texts.length, 384] — reshape the flat tensor data into per-text arrays
  const [count, dims] = output.dims;
  const embeddings = [];
  for (let i = 0; i < count; i++) {
    embeddings.push(Array.from(output.data.slice(i * dims, (i + 1) * dims)));
  }
  return embeddings;
};

/**
 * Warms up the model at server startup so the first real request isn't
 * slowed down by the model load.
 */
export const preloadEmbeddingModel = async () => {
  await getExtractor();
  console.log("Embedding model loaded and ready");
};