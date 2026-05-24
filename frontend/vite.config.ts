import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

const apiTarget = process.env.VITE_DEV_API_PROXY || "http://127.0.0.1:3000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 5173,
    // Do NOT proxy "/event" — conflicts with React route /event/:id (registration page)
    // Match /user/* API only — NOT frontend route /user-management
    proxy: {
      "/admin": { target: apiTarget, changeOrigin: true, secure: false },
      "^/user/": { target: apiTarget, changeOrigin: true, secure: false },
      "/socket.io": { target: apiTarget, changeOrigin: true, secure: false, ws: true },
      "^/event/.+/close-registration$": {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      "/uploads": { target: apiTarget, changeOrigin: true, secure: false },
    },
  },
});
