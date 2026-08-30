import api from "./api.js";

export const sendChatMessageRequest = (documentId, message) => {
  return api.post("/chat", { documentId, message });
};

export const getChatHistoryRequest = (documentId) => {
  return api.get(`/chat/${documentId}`);
};