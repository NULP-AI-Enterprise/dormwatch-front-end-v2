import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import CreateReportPage from "./pages/CreateReportPage";
import DashboardPage from "./pages/DashboardPage";
import AccountPage from "./pages/AccountPage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] min-h-screen flex flex-col justify-between">
      <Header />
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/user" element={<UserPage />} />

          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/create-report" element={
            <ProtectedRoute requireStudent>
              <CreateReportPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<div className="p-8">404 — сторінку не знайдено</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
