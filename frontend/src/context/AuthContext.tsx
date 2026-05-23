import { useDispatch } from "react-redux";
import { setAccessToken as setReduxAccessToken } from "../redux/store/slices/adminLoginSlice";
import { useEffect, useState, type ReactNode } from "react";
import API, { setAccessToken as setAxiosAccessToken } from "../api/axios";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const res = await API.post("/admin/refresh");
        const token = res.data.accessToken;

        if (token) {
          setAxiosAccessToken(token);
          localStorage.setItem("accessToken", token);
          dispatch(setReduxAccessToken(token));
        }
      } catch {
        setAxiosAccessToken(null);
        localStorage.removeItem("accessToken");
      } finally {
        setLoading(false);
      }
    };

    refreshUser();
  }, [dispatch]);

  if (loading) return <h3>Loading...</h3>;

  return <>{children}</>;
};
