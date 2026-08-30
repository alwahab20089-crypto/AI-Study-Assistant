import api from "./api.js";

export const createSubjectRequest = (data) => {
  return api.post("/subjects", data);
};

export const getSubjectsRequest = () => {
  return api.get("/subjects");
};

export const getSubjectByIdRequest = (subjectId) => {
  return api.get(`/subjects/${subjectId}`);
};

export const updateSubjectRequest = (subjectId, data) => {
  return api.patch(`/subjects/${subjectId}`, data);
};

export const deleteSubjectRequest = (subjectId) => {
  return api.delete(`/subjects/${subjectId}`);
};