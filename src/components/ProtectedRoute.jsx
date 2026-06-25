import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { fetchUserProfile } from "../services/problemsApi";
import Preloader from "./Preloader";

const ProtectedRoute = ({ children, requireAdmin, requireStudent }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserProfile()
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Preloader />;
  }

  // If user is not logged in, they can't access protected routes
  if (!user && (requireAdmin || requireStudent)) {
    return <Navigate to="/account" replace />;
  }

  const isAdminUser =
    user?.role &&
    ["admin", "адміністратор"].includes(
      (user.role.role_name || "").toLowerCase()
    );

  if (requireAdmin && !isAdminUser) {
    // Non-admin trying to access admin route
    return <Navigate to="/dashboard" replace />;
  }

  if (requireStudent && isAdminUser) {
    // Admin trying to access student route
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
