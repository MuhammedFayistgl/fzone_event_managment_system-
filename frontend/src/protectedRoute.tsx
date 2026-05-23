import React, { useEffect, useState } from "react";
import { Outlet } from "react-router";
import AdminLogin from "./login/LoginComponent";
import Splash from "./pages/Splash";
import { isTokenValid } from "./util/auth";

export const ProtectedRoute: React.FC = () => {

    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {

        const checkAuth = () => {
            const valid = isTokenValid();
            setIsAuthenticated(valid);
            setLoading(false);
        };

        setTimeout(checkAuth, 1000); // splash effect

    }, []);

    if (loading) return <Splash />;

    return isAuthenticated ? <Outlet /> : <AdminLogin />;
};