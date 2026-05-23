import { useAppSelector } from "../hooks/hooks";
import { Toaster } from "react-hot-toast";

export default function ThemedToaster() {
  const mode = useAppSelector((s) => s.theme.mode);
  const isDark = mode === "dark";

  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ top: 20, right: 20 }}
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark
            ? "rgba(15, 23, 42, 0.9)"
            : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: isDark ? "#f1f5f9" : "#0f172a",
          padding: "14px 16px",
          borderRadius: "16px",
          border: isDark
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(0,0,0,0.06)",
          boxShadow: isDark
            ? "0 20px 40px rgba(0,0,0,0.4)"
            : "0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)",
          fontSize: "14px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        },
        success: {
          iconTheme: {
            primary: "#16a34a",
            secondary: isDark ? "#0f172a" : "#ecfdf5",
          },
          style: {
            border: "1px solid rgba(22,163,74,0.25)",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626",
            secondary: isDark ? "#0f172a" : "#fef2f2",
          },
          style: {
            border: "1px solid rgba(220,38,38,0.25)",
          },
        },
        loading: {
          style: {
            border: "1px solid rgba(59,130,246,0.25)",
          },
        },
      }}
    />
  );
}
