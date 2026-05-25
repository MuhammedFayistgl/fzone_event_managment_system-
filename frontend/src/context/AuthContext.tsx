import { useDispatch } from "react-redux";
import { setAccessToken as setReduxAccessToken } from "../redux/store/slices/adminLoginSlice";
import { useEffect, useState, type ReactNode } from "react";
import API, { setAccessToken as setAxiosAccessToken } from "../api/axios";
import {
  clearAccessToken,
  getAccessToken,
  isAccessTokenValid,
} from "../utils/authRole";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshUser = async () => {
      const existingToken = getAccessToken();
      const hadValidToken = Boolean(existingToken && isAccessTokenValid());

      if (hadValidToken && existingToken) {
        setAxiosAccessToken(existingToken);
        dispatch(setReduxAccessToken(existingToken));
      }

      try {
        const res = await API.post("/admin/refresh");
        const token = res.data.accessToken;

        if (token) {
          setAxiosAccessToken(token);
          localStorage.setItem("accessToken", token);
          dispatch(setReduxAccessToken(token));
        }
      } catch {
        // Cross-origin prod (Vercel + Render) may not send refresh cookie yet —
        // keep a still-valid access token instead of logging the user out on reload.
        if (!hadValidToken) {
          setAxiosAccessToken(null);
          clearAccessToken();
        }
      } finally {
        setLoading(false);
      }
    };

    refreshUser();
  }, [dispatch]);

  if (loading) return <h3>Loading...</h3>;

  return <>{children}</>;
};
