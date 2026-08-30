import api from "./api.js";

export const startStudySessionRequest = (documentId, difficulty, questionLimit) => {
  return api.post("/study-sessions", { documentId, difficulty, questionLimit });
};

export const listStudySessionsRequest = (documentId) => {
  return api.get("/study-sessions", { params: documentId ? { documentId } : {} });
};

export const getStudySessionRequest = (sessionId) => {
  return api.get(`/study-sessions/${sessionId}`);
};

export const submitStudyAnswerRequest = (sessionId, answer) => {
  return api.post(`/study-sessions/${sessionId}/answer`, { answer });
};

export const abandonStudySessionRequest = (sessionId) => {
  return api.post(`/study-sessions/${sessionId}/abandon`);
};