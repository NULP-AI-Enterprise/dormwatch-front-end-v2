import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import AdminComplaintsPage from "./pages/AdminComplaintsPage";
import CreateReportPage from "./pages/CreateReportPage";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentLayout from "./components/StudentLayout";
import AdminLayout from "./components/AdminLayout";
import AdminTicketsPrintPage from "./pages/AdminTicketsPrintPage";
import WorkerPage from "./pages/WorkerPage";
import StudentHomePage from "./pages/StudentHomePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute requireStudent blockAdmin blockWorker>
            <StudentLayout>
              <StudentHomePage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user"
        element={
          <ProtectedRoute requireStudent blockAdmin blockWorker>
            <StudentLayout>
              <UserPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-report"
        element={
          <ProtectedRoute requireStudent blockAdmin blockWorker>
            <StudentLayout>
              <CreateReportPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireStudent blockAdmin blockWorker>
            <StudentLayout>
              <DashboardPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminComplaintsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tickets/print"
        element={
          <ProtectedRoute requireAdmin>
            <AdminTicketsPrintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker"
        element={
          <ProtectedRoute requireWorker>
            <StudentLayout>
              <WorkerPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<div className="p-8 font-bold text-muted-foreground">404 — сторінку не знайдено</div>} />
    </Routes>
  );
}

export default App;
