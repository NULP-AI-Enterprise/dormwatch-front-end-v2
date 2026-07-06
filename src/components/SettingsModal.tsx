import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchUserProfile,
  logoutUser,
  updateUserProfile,
} from "@/services/problemsApi";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  Home01Icon,
  AiPhone01Icon,
  UserIcon,
  ShieldIcon,
  Briefcase01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import { isAdminUser, isWorkerUser, getUserInitials } from "@/lib/complaintUtils";

const CONTACT_PHONES = {
  commandant: "093 123 45 67",
  dutyMaster: "067 987 65 43",
};

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [contactInfo, setContactInfo] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserProfile();
      setUser(data);
      setContactInfo(data?.contact_info || "");
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveContactInfo = async () => {
    setSavingProfile(true);
    try {
      const updated = await updateUserProfile({ contact_info: contactInfo });
      setUser(updated);
    } catch (err) {
      console.error("Failed to update contact info", err);
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProfile();
      setActiveTab("profile");
    }
  }, [open, loadProfile]);


  const placeObj = user?.place;
  const buildingObj = placeObj?.building;
  const buildingInfo = buildingObj
    ? buildingObj.name || `№${buildingObj.number || buildingObj.building_id || "??"}`
    : "Не вказано";
  const roomInfo = placeObj ? placeObj.place_name : "Кімната не вказана";

  const SERVER_URL = "http://127.0.0.1:8000";
  const userInitials = getUserInitials(user, "U");
  const photoUrl = user?.photo_url
    ? (() => {
        const path = user.photo_url;
        const isAbsolute = path.startsWith("http") || path.startsWith("blob:");
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return isAbsolute
          ? path
          : `${SERVER_URL}${cleanPath.startsWith("/api") ? "" : "/api"}${cleanPath}`;
      })()
    : null;

  const isAdmin = isAdminUser(user);
  const isWorker = isWorkerUser(user);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/auth";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl md:max-w-2xl p-0 gap-0 overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Налаштування</DialogTitle>
          <DialogDescription>Керування профілем та налаштуваннями</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[80vh]">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-card">
            <div className="w-12 h-12 bg-muted border border-border shrink-0 overflow-hidden flex items-center justify-center">
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : photoUrl ? (
                <img
                  src={photoUrl}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  {userInitials}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground truncate">
                  {user ? `${user.first_name} ${user.last_name}` : "Завантаження..."}
                </p>
                {user && (
                  <Badge
                    variant="outline"
                    className={
                      isAdmin
                        ? "text-yellow-500 bg-yellow-500/10 border-yellow-700/50"
                        : isWorker
                        ? "text-[#d7ccc8] bg-[#4e342e] border-[#5d4037]"
                        : "text-blue-500 bg-blue-500/10 border-blue-700/50"
                    }
                  >
                    {isAdmin ? "Адмін" : isWorker ? "Працівник" : "Студент"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="border-b border-border px-5">
              <TabsList variant="line" className="h-9">
                <TabsTrigger value="profile" className="text-xs font-semibold">
                  <HugeiconsIcon icon={UserIcon} className="size-3 mr-1" strokeWidth={2} />
                  Профіль
                </TabsTrigger>
                <TabsTrigger value="room" className="text-xs font-semibold">
                  <HugeiconsIcon icon={Home01Icon} className="size-3 mr-1" strokeWidth={2} />
                  Розміщення
                </TabsTrigger>
                <TabsTrigger value="contacts" className="text-xs font-semibold">
                  <HugeiconsIcon icon={AiPhone01Icon} className="size-3 mr-1" strokeWidth={2} />
                  Контакти
                </TabsTrigger>

              </TabsList>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5">
                <TabsContent value="profile" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 py-1.5 px-2">
                        <div className="w-7 h-7 bg-muted border border-border flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={UserIcon} className="size-3.5 text-primary" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-normal text-muted-foreground">Ім'я</p>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {user?.first_name || "Не вказано"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 px-2">
                        <div className="w-7 h-7 bg-muted border border-border flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={UserIcon} className="size-3.5 text-primary" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-normal text-muted-foreground">Прізвище</p>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {user?.last_name || "Не вказано"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 px-2">
                        <div className="w-7 h-7 bg-muted border border-border flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={Building03Icon} className="size-3.5 text-primary" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-normal text-muted-foreground">Гуртожиток</p>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {buildingInfo}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 py-1.5 px-2">
                        <div className="w-7 h-7 bg-muted border border-border flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={Home01Icon} className="size-3.5 text-primary" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-normal text-muted-foreground">Кімната</p>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {roomInfo}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator dashed />

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/10"
                      onClick={handleLogout}
                    >
                      <HugeiconsIcon icon={Logout01Icon} className="size-3 mr-1.5" strokeWidth={2} />
                      Вийти
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="room" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
                  <div className="space-y-4">
                    <div className="p-3 bg-muted border border-border">
                      <p className="text-xs font-semibold text-foreground mb-1.5">Поточне розміщення</p>
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Building03Icon} className="size-4 text-primary" strokeWidth={1.5} />
                        <p className="text-sm font-bold text-foreground">{buildingInfo}</p>
                        <span className="w-1 h-1 bg-border inline-block mx-1.5" />
                        <HugeiconsIcon icon={Home01Icon} className="size-4 text-primary" strokeWidth={2} />
                        <p className="text-sm font-bold text-foreground">{roomInfo}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contacts" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
                  {!isWorker && !isAdmin && (
                    <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg space-y-3">
                      <h4 className="text-xs font-bold text-foreground">
                        Контактні дані для майстра
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Додайте свої контактні дані (номер телефону), щоб майстер міг зв'язатись з вами для обговорення часу, якщо вас не буде на місці. Це поле є опціональним.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Наприклад: 0931234567"
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          className="text-xs h-9 bg-card"
                          disabled={savingProfile}
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveContactInfo}
                          disabled={savingProfile || contactInfo.trim() === (user?.contact_info || "")}
                          className="h-9 text-xs font-semibold px-4 shrink-0"
                        >
                          {savingProfile ? "..." : "Зберегти"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <h4 className="text-xs font-bold text-muted-foreground mb-6">
                    Екстрені контакти
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-muted border border-border p-4">
                      <div className="p-2 bg-card border border-border shrink-0">
                        <HugeiconsIcon icon={Briefcase01Icon} className="size-4 text-primary" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">
                          Комендант
                        </p>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {CONTACT_PHONES.commandant}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-muted border border-border p-4">
                      <div className="p-2 bg-card border border-border shrink-0">
                        <HugeiconsIcon icon={AiPhone01Icon} className="size-4 text-primary" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">
                          Черговий майстер
                        </p>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {CONTACT_PHONES.dutyMaster}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 border border-dashed border-border text-center">
                      <HugeiconsIcon icon={ShieldIcon} className="size-5 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-xs text-muted-foreground font-semibold">
                        Екстрені ситуації — телефонуйте 101 або 112
                      </p>
                    </div>
                  </div>
                </TabsContent>


              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { SettingsModal };
