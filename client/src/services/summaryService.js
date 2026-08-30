import api from "./api.js";

export const generateSummaryRequest = (documentId, length, regenerate = false) => {
  return api.post("/summaries", { documentId, length, regenerate });
};

export const getSummariesRequest = (documentId) => {
  return api.get(`/summaries/${documentId}`);
};

export const deleteSummaryRequest = (summaryId) => {
  return api.delete(`/summaries/${summaryId}`);
};