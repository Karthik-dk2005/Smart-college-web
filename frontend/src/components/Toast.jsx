import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msgOrObj, maybeType = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    let message = "";
    let title = "";
    let type = maybeType;

    if (typeof msgOrObj === "object" && msgOrObj !== null) {
      message = msgOrObj.message || msgOrObj.title || "";
      title = msgOrObj.title || "";
      type = msgOrObj.type || maybeType;
    } else {
      message = String(msgOrObj);
    }

    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg) => addToast(msg, "error", 5000), [addToast]);
  const info = useCallback((msg) => addToast(msg, "info"), [addToast]);
  const warning = useCallback((msg) => addToast(msg, "warning"), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: "400px",
          width: "90%",
        }}
      >
        {toasts.map((toast) => {
          let bg = "rgba(17, 24, 39, 0.95)";
          let border = "rgba(255, 255, 255, 0.1)";
          let icon = <Info size={18} color="#06b6d4" />;

          if (toast.type === "success") {
            bg = "rgba(6, 78, 59, 0.95)";
            border = "rgba(16, 185, 129, 0.4)";
            icon = <CheckCircle2 size={18} color="#10b981" />;
          } else if (toast.type === "error") {
            bg = "rgba(127, 29, 29, 0.95)";
            border = "rgba(239, 68, 68, 0.4)";
            icon = <AlertCircle size={18} color="#ef4444" />;
          } else if (toast.type === "warning") {
            bg = "rgba(120, 53, 15, 0.95)";
            border = "rgba(245, 158, 11, 0.4)";
            icon = <AlertCircle size={18} color="#f59e0b" />;
          }

          return (
            <div
              key={toast.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.85rem 1.1rem",
                borderRadius: "10px",
                background: bg,
                border: `1px solid ${border}`,
                color: "#f8fafc",
                fontSize: "0.9rem",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(8px)",
                animation: "slideIn 0.25s ease-out",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ marginTop: "2px" }}>{icon}</div>
                <div>
                  {toast.title && (
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "2px" }}>
                      {toast.title}
                    </div>
                  )}
                  <div style={{ fontSize: "0.85rem", opacity: 0.95 }}>{toast.message}</div>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
