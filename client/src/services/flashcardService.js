import api from "./api.js";

export const generateFlashcardsRequest = (documentId, cardCount, difficulty) => {
  return api.post("/flashcards", { documentId, cardCount, difficulty });
};

export const getFlashcardSetRequest = (flashcardSetId) => {
  return api.get(`/flashcards/${flashcardSetId}`);
};

export const listFlashcardSetsRequest = (documentId) => {
  return api.get("/flashcards", { params: documentId ? { documentId } : {} });
};

export const submitFlashcardProgressRequest = (flashcardSetId, cardIndex, status) => {
  return api.post(`/flashcards/${flashcardSetId}/progress`, { cardIndex, status });
};

export const getFlashcardProgressRequest = (flashcardSetId) => {
  return api.get(`/flashcards/${flashcardSetId}/progress`);
};