import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(() => localStorage.getItem("auth_role") || null);
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Restore authenticated session on load
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem("auth_token");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getCurrentUser();
        if (res && res.user) {
          setUser(res.user);
          setRole(res.user.role);
          localStorage.setItem("auth_user", JSON.stringify(res.user));
          localStorage.setItem("auth_role", res.user.role);
        }
      } catch (err) {
        console.warn("Session restore failed, logging out:", err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (!data.access_token) {
      throw new Error("Invalid response from server: Missing access token");
    }

    localStorage.setItem("auth_token", data.access_token);
    localStorage.setItem("auth_role", data.role);
    setToken(data.access_token);
    setRole(data.role);

    // Fetch full profile
    const profileRes = await api.getCurrentUser();
    if (profileRes && profileRes.user) {
      setUser(profileRes.user);
      localStorage.setItem("auth_user", JSON.stringify(profileRes.user));
    } else {
      const basicUser = {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      };
      setUser(basicUser);
      localStorage.setItem("auth_user", JSON.stringify(basicUser));
    }

    setActiveTab("dashboard");
    return data;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_role");
      localStorage.removeItem("auth_user");
      setToken(null);
      setUser(null);
      setRole(null);
      setActiveTab("dashboard");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
