import { Link, useLocation, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  DashboardSquare01Icon,
  GroupIcon,
  File01Icon,
  SettingsIcon,
  Download01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { type ReactNode, useState } from "react";
import { getUserInitials } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import { SettingsModal } from "./SettingsModal";
import { NotificationBell } from "./NotificationBell";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const initials = getUserInitials(user, "AD");

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/admin":
        return "Загальний огляд";
      case "/admin/residents":
        return "Мешканці гуртожитків";
      case "/admin/complaints":
        return "Всі скарги";
      case "/admin/control-panel":
        return "Панель керування";
      default:
        return "DormWatch";
    }
  };

  const handleSelectComplaintFromBell = (complaint: any) => {
    if (currentPath === "/admin" || currentPath === "/admin/complaints") {
      window.dispatchEvent(new CustomEvent("openComplaint", { detail: complaint }));
    } else {
      sessionStorage.setItem("pendingOpenComplaintId", String(complaint.id));
      navigate("/admin/complaints");
    }
  };

  const handleExportClick = () => {
    window.dispatchEvent(new CustomEvent("triggerExport"));
  };

  const handleAssignClick = () => {
    window.dispatchEvent(new CustomEvent("triggerAssignWorker"));
  };

  const navItems = [
    { name: "Загальний огляд", path: "/admin", icon: <HugeiconsIcon icon={DashboardSquare01Icon} className="size-5" /> },
    { name: "Мешканці", path: "/admin/residents", icon: <HugeiconsIcon icon={GroupIcon} className="size-5" /> },
    { name: "Всі скарги", path: "/admin/complaints", icon: <HugeiconsIcon icon={File01Icon} className="size-5" /> },
    { name: "Панель керування", path: "/admin/control-panel", icon: <HugeiconsIcon icon={SettingsIcon} className="size-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background bg-dot-grid relative">
      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 bg-background border-r border-border flex flex-col md:sticky md:top-0 md:h-screen z-40 relative">
        <div className="h-20 px-6 flex items-center border-b border-border">
          <div className="flex items-center gap-3 text-primary font-bold text-xl">
            <HugeiconsIcon icon={Building03Icon} className="size-6" strokeWidth={1.5} />
            <span>DormWatch</span>
          </div>
        </div>

        <nav className="flex-1 py-6">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const isInactive = item.path === "#";
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all border-l-4 ${
                  isInactive
                    ? "border-transparent text-muted-foreground/30 cursor-not-allowed pointer-events-none"
                    : isActive
                    ? "border-blue-500 bg-primary/5 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" onClick={() => setIsSettingsOpen(true)} className="w-full justify-start gap-3 px-4 py-3 text-left hover:bg-muted/50">
            <div className="w-10 h-10 bg-card border border-border flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-foreground truncate">
                {user ? `${user.first_name} ${user.last_name}` : "Адмін"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold truncate">
                {user?.role?.role_name === "admin" ? "Адміністратор" : "Працівник"}
              </span>
            </div>
          </Button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 lg:px-8 shrink-0">
          <h1 className="text-2xl font-bold text-foreground">
            {getPageTitle(currentPath)}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell onSelectComplaint={handleSelectComplaintFromBell} />
            {(currentPath === "/admin" || currentPath === "/admin/complaints") && (
              <>
                <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" onClick={handleExportClick}>
                  <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={2} />
                  Експорт даних
                </Button>
                <Button size="sm" className="gap-2 h-9 text-xs" onClick={handleAssignClick}>
                  <HugeiconsIcon icon={Ticket01Icon} className="size-4" strokeWidth={2} />
                  Призначити працівника
                </Button>
              </>
            )}
          </div>
        </header>
        {children}
      </main>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
};

export default AdminLayout;
