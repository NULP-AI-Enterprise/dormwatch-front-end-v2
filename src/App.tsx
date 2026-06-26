import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import AdminComplaintsPage from "./pages/AdminComplaintsPage";
import CreateReportPage from "./pages/CreateReportPage";
import DashboardPage from "./pages/DashboardPage";
import AccountPage from "./pages/AccountPage";
import AuthPage from "./pages/AuthPage";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="dark min-h-screen flex flex-col justify-between">
      <Routes>
        <Route path="/admin/*" element={
          <Routes>
            <Route path="/" element={<AdminPage />} />
            <Route path="/complaints" element={<AdminComplaintsPage />} />
          </Routes>
        } />
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={
          <>
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/user" element={<UserPage />} />
                <Route path="/create-report" element={<CreateReportPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Routes>
            </main>
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
