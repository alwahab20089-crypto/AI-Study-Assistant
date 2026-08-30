const MIN_MEANINGFUL_BACK_LENGTH = 15; // guards against near-empty/meaningless answers

/**
 * Validates AI-generated flashcard JSON against the structural and quality
 * rules from the spec. Returns { valid: true } or { valid: false, reason }
 * — never throws, so the caller can decide whether to retry.
 *
 * @param {*} data - parsed JSON from the AI response
 * @param {number} expectedCardCount
 * @returns {{ valid: boolean, reason?: string }}
 */
export const validateFlashcardData = (data, expectedCardCount) => {
  if (!data || typeof data !== "object") {
    return { valid: false, reason: "Response was not a valid object" };
  }

  if (typeof data.title !== "string" || !data.title.trim()) {
    return { valid: false, reason: "Missing or invalid title" };
  }

  if (!Array.isArray(data.cards)) {
    return { valid: false, reason: "Missing cards array" };
  }

  if (data.cards.length !== expectedCardCount) {
    return {
      valid: false,
      reason: `Expected ${expectedCardCount} cards, got ${data.cards.length}`,
    };
  }

  const seenFronts = new Set();

  for (let i = 0; i < data.cards.length; i++) {
    const card = data.cards[i];
    const label = `Card ${i + 1}`;

    if (!card || typeof card !== "object") {
      return { valid: false, reason: `${label}: not a valid object` };
    }

    if (typeof card.front !== "string" || !card.front.trim()) {
      return { valid: false, reason: `${label}: missing front` };
    }

    if (typeof card.back !== "string" || !card.back.trim()) {
      return { valid: false, reason: `${label}: missing back` };
    }

    if (card.back.trim().length < MIN_MEANINGFUL_BACK_LENGTH) {
      return {
        valid: false,
        reason: `${label}: answer is too short to be meaningful ("${card.back.trim()}")`,
      };
    }

    // Guard against the exact low-quality pattern the spec calls out —
    // a card whose answer is just a restatement like "The document says..."
    const lowerBack = card.back.trim().toLowerCase();
    if (
      lowerBack.startsWith("the document says") ||
      lowerBack.startsWith("the document states") ||
      lowerBack.startsWith("this document")
    ) {
      return {
        valid: false,
        reason: `${label}: answer is a meaningless restatement rather than real content`,
      };
    }

    const normalizedFront = card.front.trim().toLowerCase().replace(/\s+/g, " ");
    if (seenFronts.has(normalizedFront)) {
      return { valid: false, reason: `${label}: duplicate front (question) text` };
    }
    seenFronts.add(normalizedFront);
  }

  return { valid: true };
};