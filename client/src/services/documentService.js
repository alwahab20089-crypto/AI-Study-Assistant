import api from "./api.js";

export const uploadDocumentRequest = (formData, onUploadProgress) => {
  return api.post("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
};

export const getDocumentsRequest = (params = {}) => {
  return api.get("/documents", { params });
};

export const getDocumentByIdRequest = (id) => {
  return api.get(`/documents/${id}`);
};

export const updateDocumentRequest = (id, data) => {
  return api.patch(`/documents/${id}`, data);
};

export const deleteDocumentRequest = (id) => {
  return api.delete(`/documents/${id}`);
};