import { Navigate, Outlet } from "react-router-dom";
import { getEncodedCookie } from "@/utils/reusable";

const isAuthenticated = () => {
  const traineeId = getEncodedCookie("traineeId");
  return Boolean(traineeId);
};

export const PrivateRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export const PublicRoute = () => {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Outlet />;
};
