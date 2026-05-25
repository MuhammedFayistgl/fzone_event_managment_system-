import { Navigate } from "react-router-dom";
import { getAccessToken, getRoleFromToken, clearAccessToken } from "../utils/authRole";

type ProtectedRouteProps = {
  children: React.ReactNode;
  role?: string;
  roles?: string[];
};

const ProtectedRoute = ({ children, role = "admin", roles }: ProtectedRouteProps) => {
  const token = getAccessToken();
  const allowedRoles = roles?.length ? roles : [role];

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getRoleFromToken(token);

  if (!userRole) {
    clearAccessToken();
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
