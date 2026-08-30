import api from "./api.js";

export const generateQuizRequest = (documentId, questionCount, difficulty, topic) => {
  return api.post("/quizzes", {
    documentId,
    questionCount,
    difficulty,
    ...(topic ? { topic } : {}),
  });
};

export const getQuizRequest = (quizId) => {
  return api.get(`/quizzes/${quizId}`);
};

export const listQuizzesRequest = (documentId) => {
  return api.get("/quizzes", { params: documentId ? { documentId } : {} });
};

export const submitQuizRequest = (quizId, answers) => {
  return api.post(`/quizzes/${quizId}/submit`, { answers });
};