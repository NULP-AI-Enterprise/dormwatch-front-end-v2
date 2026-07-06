import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminUser, isWorkerUser } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import LoadingSpinner from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireWorker?: boolean;
  requireStudent?: boolean;
  blockAdmin?: boolean;
  blockWorker?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAdmin,
  requireWorker,
  requireStudent,
  blockAdmin,
  blockWorker,
}: ProtectedRouteProps) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const admin = isAdminUser(user);
  const worker = isWorkerUser(user);
  const student = user && !admin && !worker;
  const isAuthPage = location.pathname === "/auth";

  if (!user && !isAuthPage) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !admin) {
    return <Navigate to="/" replace />;
  }

  if (requireWorker && !worker) {
    return <Navigate to="/" replace />;
  }

  if (requireStudent && !student) {
    if (admin) {
      return <Navigate to="/admin" replace />;
    }
    if (worker) {
      return <Navigate to="/worker" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (blockAdmin && admin) {
    return <Navigate to="/admin" replace />;
  }

  if (blockWorker && worker) {
    return <Navigate to="/worker" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
