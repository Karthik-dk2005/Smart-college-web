import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import authApi from "../api/auth";

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user") || sessionStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem("role") || sessionStorage.getItem("role") || null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  });
  const [loading, setLoading] = useState(true);
  const [inactivityNotice, setInactivityNotice] = useState(false);

  const lastActivityRef = useRef(Date.now());

  // Logout handler
  const logout = useCallback(async (isAutoLogout = false) => {
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
      sessionStorage.clear();

      setToken(null);
      setUser(null);
      setRole(null);

      if (isAutoLogout) {
        setInactivityNotice(true);
      }
    }
  }, []);

  // Restore authenticated session on mount
  useEffect(() => {
    async function restoreSession() {
      const savedToken =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("auth_token");

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        const userData = res.data || res.user || res;
        if (userData && (userData.email || userData.username)) {
          setUser(userData);
          setRole(userData.role);

          const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
          storage.setItem("user", JSON.stringify(userData));
          storage.setItem("role", userData.role);
          setToken(savedToken);
        } else {
          logout();
        }
      } catch (err) {
        console.warn("Session restore failed, logging out:", err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [logout]);

  // Inactivity tracking (30 minutes auto-logout)
  useEffect(() => {
    if (!token) return;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    const checkInterval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        console.warn("User inactive for 30 minutes, logging out...");
        logout(true);
      }
    }, 60000); // Check every minute

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
      clearInterval(checkInterval);
    };
  }, [token, logout]);

  /**
   * Unified login function
   * Supports: login("admin@campus.edu", "pass") or login({ username_or_email: "...", password: "...", remember_me: true })
   */
  const login = async (credentialsOrEmail, password, rememberMe = false) => {
    let payload;
    let shouldRemember = false;

    if (typeof credentialsOrEmail === "object" && credentialsOrEmail !== null) {
      payload = credentialsOrEmail;
      shouldRemember = Boolean(credentialsOrEmail.remember_me);
    } else {
      payload = {
        username_or_email: credentialsOrEmail,
        password: password,
        remember_me: Boolean(rememberMe),
      };
      shouldRemember = Boolean(rememberMe);
    }

    const res = await authApi.login(payload);
    const data = res.data || res;

    if (!data.access_token) {
      throw new Error("Login failed: Missing access token in server response");
    }

    if (data.account_status === "Pending") {
      throw new Error(
        "Your account registration is currently pending approval by the Admin or HOD."
      );
    }

    if (data.account_status === "Rejected") {
      throw new Error("Your account has been rejected. Please contact your department.");
    }

    if (data.account_status === "Suspended") {
      throw new Error("Your account has been suspended. Please contact the administrator.");
    }

    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const userRole = (data.role || "student").toLowerCase();

    const targetStorage = shouldRemember ? localStorage : sessionStorage;

    targetStorage.setItem("token", accessToken);
    targetStorage.setItem("auth_token", accessToken);
    if (refreshToken) {
      targetStorage.setItem("refresh_token", refreshToken);
    }
    targetStorage.setItem("role", userRole);

    setToken(accessToken);
    setRole(userRole);
    setInactivityNotice(false);
    lastActivityRef.current = Date.now();

    // Fetch full profile info
    try {
      const profileRes = await authApi.getMe();
      const profileData = profileRes.data || profileRes.user || profileRes;
      setUser(profileData);
      targetStorage.setItem("user", JSON.stringify(profileData));
      return profileData;
    } catch {
      const fallbackUser = {
        id: data.user_id,
        name: data.name,
        full_name: data.full_name || data.name,
        email: data.email,
        username: data.username,
        role: userRole,
        account_status: data.account_status || "Approved",
        department_id: data.department_id,
        usn: data.usn,
        gmail: data.gmail,
        semester: data.semester,
        section: data.section,
        department: data.department,
      };
      setUser(fallbackUser);
      targetStorage.setItem("user", JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    return res.data || res;
  };

  const forgotPassword = async (email) => {
    const res = await authApi.forgotPassword(email);
    return res.data || res;
  };

  const resetPassword = async ({ token, new_password, confirm_password }) => {
    const res = await authApi.resetPassword({ token, new_password, confirm_password });
    return res.data || res;
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      const userData = res.data || res.user || res;
      if (userData) {
        setUser(userData);
        setRole(userData.role);
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(userData));
        storage.setItem("role", userData.role);
      }
    } catch (e) {
      console.warn("Could not refresh user profile:", e);
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
        inactivityNotice,
        setInactivityNotice,
        login,
        register,
        forgotPassword,
        resetPassword,
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
