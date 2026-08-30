import api from "./api.js";

export const getOverviewRequest = () => api.get("/progress/overview");
export const getQuizPerformanceRequest = () => api.get("/progress/quiz-performance");
export const getActivityRequest = (limit) =>
  api.get("/progress/activity", { params: limit ? { limit } : {} });
export const getDocumentProgressRequest = () => api.get("/progress/documents");
export const getFlashcardProgressRequest = () => api.get("/progress/flashcards");
export const getStudySessionStatsRequest = () => api.get("/progress/study-sessions");
export const getWeeklyActivityRequest = () => api.get("/progress/weekly");
export const getWeakTopicsRequest = () => api.get("/progress/weak-topics");