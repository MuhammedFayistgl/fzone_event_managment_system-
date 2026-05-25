import axios from "axios";
import { reconnectLiveSocket, disconnectLiveSocket } from "../live/socket";

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/**
 * Dev: same-origin via Vite proxy (HTTPS laptop + mobile, no mixed-content).
 * Prod: set VITE_API_BASE_URL in .env
 */
export const resolveBaseURL = () => {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (import.meta.env.PROD && envUrl) {
    return String(envUrl).replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return "";
  }

  const host = window.location.hostname;
  const apiPort = import.meta.env.VITE_API_PORT || "3000";
  return `http://${host}:${apiPort}`;
};

export const getApiBaseURL = () => resolveBaseURL();

const API = axios.create({
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  config.baseURL = resolveBaseURL();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(err);
    }

    if (originalRequest.url?.includes("/admin/refresh")) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(API(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${resolveBaseURL()}/admin/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;

        setAccessToken(newToken);
        localStorage.setItem("accessToken", newToken);
        reconnectLiveSocket();

        onRefreshed(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        localStorage.removeItem("accessToken");
        disconnectLiveSocket();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default API;
