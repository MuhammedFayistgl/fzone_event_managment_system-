import axios from "axios";

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};
const host = window.location.hostname;
const API = axios.create({
    baseURL: `http://${host}:3000`,
    withCredentials: true, // 🔐 important for cookies
});

// 🔹 REQUEST → attach token
API.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// 🔹 REFRESH CONTROL
let isRefreshing = false;
let refreshSubscribers: any[] = [];

// 🔹 queue system
const subscribeTokenRefresh = (cb: any) => {
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

        // ❗ Skip refresh API itself
        if (originalRequest.url.includes("/refresh")) {
            return Promise.reject(err);
        }

        if (err.response?.status === 401) {

            // 🔁 already refreshing → queue request
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
                    `baseURL: http://${host}:3000/admin/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newToken = res.data.accessToken;

                setAccessToken(newToken);
                localStorage.setItem("accessToken", newToken);

                onRefreshed(newToken);

                return API(originalRequest);

            } catch (error) {
                // 🔴 logout
                setAccessToken(null);
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
                return Promise.reject(error);

            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(err);
    }
);

export default API;