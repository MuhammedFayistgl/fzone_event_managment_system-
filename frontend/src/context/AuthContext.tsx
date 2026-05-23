import { useDispatch } from "react-redux";
import { setAccessToken } from "../redux/store/slices/adminLoginSlice";
import { useEffect, useState, type ReactNode } from "react";
import API from "../api/axios";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const refreshUser = async () => {
            try {
                const res = await API.post("/admin/refresh");

                // ✅ set axios token
                setAccessToken(res.data.accessToken);

                // ✅ set redux token
                dispatch(setAccessToken(res.data.accessToken));

            } catch {
                // ❌ no session
            } finally {
                setLoading(false);
            }
        };

        refreshUser();
    }, []);

    if (loading) return <h3>Loading...</h3>;

    return <>{children}</>;
};