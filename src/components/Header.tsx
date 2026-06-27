import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useState, useEffect } from "react";
import { fetchUserProfile, logoutUser } from "../services/problemsApi";
import { getUserInitials } from "../lib/complaintUtils";
import { Building2, Bell, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SettingsModal } from "./SettingsModal";

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    fetchUserProfile()
      .then((u) => setUser(u))
      .catch(() => {});

    const onProfileUpdate = () => {
      fetchUserProfile()
        .then((u) => setUser(u))
        .catch(() => {});
    };
    window.addEventListener("profileUpdated", onProfileUpdate);
    return () => window.removeEventListener("profileUpdated", onProfileUpdate);
  }, []);

  const initials = getUserInitials(user, "U");

  return (
    <>
      <nav className="bg-stone-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/user" className="flex items-center gap-2 text-blue-500 font-bold text-xl tracking-tight">
            <Building2 className="w-6 h-6" strokeWidth={1.5} />
            <span>DormWatch</span>
          </a>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-stone-400 hover:text-stone-50">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <Separator orientation="vertical" className="hidden sm:block h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 cursor-pointer hover:opacity-80 transition-opacity outline-none">
                  <div className="w-8 h-8 bg-stone-700 flex items-center justify-center text-stone-300 font-semibold text-sm">
                    {initials}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="text-xs font-semibold cursor-pointer"
                  onSelect={() => setSettingsOpen(true)}
                >
                  <Settings className="w-3.5 h-3.5 mr-2" strokeWidth={2} />
                  Налаштування
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs font-semibold text-destructive cursor-pointer"
                  onSelect={logoutUser}
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" strokeWidth={2} />
                  Вийти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Separator />
      </nav>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default Header;
