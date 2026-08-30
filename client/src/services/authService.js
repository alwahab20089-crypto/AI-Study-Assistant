import api from "./api.js";

export const registerRequest = (data) => {
  return api.post("/auth/register", data);
};

export const loginRequest = (data) => {
  return api.post("/auth/login", data);
};

export const logoutRequest = () => {
  return api.post("/auth/logout");
};

export const getMeRequest = () => {
  return api.get("/auth/me");
};