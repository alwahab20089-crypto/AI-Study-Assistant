import api from "./api.js";

export const createGoalRequest = (data) => api.post("/goals", data);

export const getTodayGoalsRequest = () => api.get("/goals/today");

export const updateGoalRequest = (goalId, target) =>
  api.patch(`/goals/${goalId}`, { target });

export const deleteGoalRequest = (goalId) => api.delete(`/goals/${goalId}`);

export const getGoalHistoryRequest = (from, to) =>
  api.get("/goals", { params: { from, to } });