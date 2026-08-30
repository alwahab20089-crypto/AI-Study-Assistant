const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 150;

const getConfig = () => ({
  chunkSize: parseInt(process.env.CHUNK_SIZE, 10) || DEFAULT_CHUNK_SIZE,
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10) || DEFAULT_CHUNK_OVERLAP,
});

// Splits text into paragraphs first (blank-line separated), falling back to
// single-newline splits if the document has no blank lines at all.
const splitIntoParagraphs = (text) => {
  const byBlankLine = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (byBlankLine.length > 1) return byBlankLine;
  return text.split(/\n/).map((p) => p.trim()).filter(Boolean);
};

// Splits an oversized paragraph into sentence-ish pieces so we still avoid
// cutting mid-word when a single paragraph exceeds the chunk size.
const splitIntoSentences = (text) => {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  return sentences ? sentences.map((s) => s.trim()).filter(Boolean) : [text];
};

/**
 * Splits document text into overlapping chunks, preferring paragraph and
 * sentence boundaries over mid-word cuts.
 * @param {string} text - full extracted document text
 * @returns {string[]} array of chunk strings, in order
 */
export const chunkText = (text) => {
  const { chunkSize, chunkOverlap } = getConfig();

  if (!text || !text.trim()) return [];

  const paragraphs = splitIntoParagraphs(text);
  const chunks = [];
  let current = "";

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const paragraph of paragraphs) {
    // Paragraph itself is too big for a single chunk — break it into sentences
    const pieces =
      paragraph.length > chunkSize ? splitIntoSentences(paragraph) : [paragraph];

    for (const piece of pieces) {
      // A single sentence longer than chunkSize (rare, but possible) —
      // hard-split it as a last resort so we never produce an unbounded chunk.
      if (piece.length > chunkSize) {
        let remaining = piece;
        while (remaining.length > chunkSize) {
          pushCurrent();
          chunks.push(remaining.slice(0, chunkSize).trim());
          remaining = remaining.slice(chunkSize - chunkOverlap);
        }
        current = remaining;
        continue;
      }

      const candidate = current ? `${current} ${piece}` : piece;

      if (candidate.length <= chunkSize) {
        current = candidate;
      } else {
        pushCurrent();
        // Start the new chunk with overlap from the end of the previous chunk
        const previousChunk = chunks[chunks.length - 1] || "";
        const overlapText = previousChunk.slice(-chunkOverlap).trim();
        current = overlapText ? `${overlapText} ${piece}` : piece;
      }
    }
  }

  pushCurrent();

  return chunks;
};