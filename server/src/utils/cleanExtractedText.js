export const normalizeText = (text) => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// A very short or whitespace-only result usually means the PDF was
// scanned images with no embedded text layer (would require OCR, which
// is explicitly out of scope for this phase).
export const isMeaningfulText = (text) => {
  const normalized = normalizeText(text);
  return normalized.length >= 20;
};