import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

type ProtectedRouteProps = {
  children: React.ReactNode;
  role?: string;
};

const ProtectedRoute = ({ children, role = "admin" }: ProtectedRouteProps) => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode<{ exp?: number; role?: string }>(token);

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("accessToken");
      return <Navigate to="/login" replace />;
    }

    if (role && decoded.role && decoded.role !== role) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
  } catch {
    localStorage.removeItem("accessToken");
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
