import React, { createContext, useContext, useState, useEffect } from "react";
import authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(() => localStorage.getItem("role") || null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on mount
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        const userData = res.data || res.user || res;
        if (userData && userData.email) {
          setUser(userData);
          setRole(userData.role);
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("role", userData.role);
          localStorage.setItem("token", savedToken);
        }
      } catch (err) {
        console.warn("Session restore failed, logging out:", err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const data = res.data || res;

    if (!data.access_token) {
      throw new Error("Login failed: Missing access token in response");
    }

    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const userRole = data.role?.toLowerCase();

    localStorage.setItem("token", accessToken);
    localStorage.setItem("auth_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
    localStorage.setItem("role", userRole);

    setToken(accessToken);
    setRole(userRole);

    // Fetch full profile info
    try {
      const profileRes = await authApi.getMe();
      const profileData = profileRes.data || profileRes.user || profileRes;
      setUser(profileData);
      localStorage.setItem("user", JSON.stringify(profileData));
      return profileData;
    } catch (e) {
      const fallbackUser = {
        id: data.user_id,
        name: data.name,
        email: data.email,
        role: userRole,
      };
      setUser(fallbackUser);
      localStorage.setItem("user", JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    return res;
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      const userData = res.data || res.user || res;
      if (userData) {
        setUser(userData);
        setRole(userData.role);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("role", userData.role);
      }
    } catch (e) {
      console.warn("Could not refresh user profile:", e);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      setToken(null);
      setUser(null);
      setRole(null);
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
        register,
        logout,
        refreshUser,
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
