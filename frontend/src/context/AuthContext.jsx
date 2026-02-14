import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const API_URL = import.meta.env.VITE_API_URL;
  const AUTH_API = `${API_URL}/api/auth`;

  useEffect(() => {
    // Add request interceptor to always include token
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }

    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`${AUTH_API}/me`);
      setUser(response.data);
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${AUTH_API}/register`, userData);
      const { token: newToken, ...userInfo } = response.data;
      
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userInfo);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${AUTH_API}/login`, credentials);
      const { token: newToken, ...userInfo } = response.data;
      
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userInfo);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
