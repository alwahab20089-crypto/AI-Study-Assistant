import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  loginRequest,
  registerRequest,
  logoutRequest,
  getMeRequest,
} from "../services/authService.js";
import getErrorMessage from "../utils/getErrorMessage.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check existing session

  const checkAuth = useCallback(async () => {
    try {
      const res = await getMeRequest();
      setUser(res.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async ({ email, password }) => {
    try {
      const res = await loginRequest({ email, password });
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  const register = async ({ name, email, password, confirmPassword }) => {
    try {
      const res = await registerRequest({ name, email, password, confirmPassword });
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // Even if the request fails, clear local state so the UI reflects logged-out
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};