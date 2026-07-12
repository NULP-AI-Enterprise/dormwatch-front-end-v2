import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchUserProfile,
  logoutUser,
  updateUserProfile,
  changePassword,
} from "@/services/problemsApi";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  Home01Icon,
  AiPhone01Icon,
  ShieldIcon,
  Briefcase01Icon,
  Logout01Icon,
  LockPasswordIcon,
  CheckmarkCircleIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import { isAdminUser, isWorkerUser, getUserInitials } from "@/lib/complaintUtils";

const formatPhoneNumber = (phone: string | undefined | null) => {
  if (!phone) return "Не вказано";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  if (digits.length === 12 && digits.startsWith("38")) {
    const local = digits.slice(2);
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
  }
  return phone;
};

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
  const [activeTab, setActiveTab] = useState("security");
  const [contactInfo, setContactInfo] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Заповніть всі поля");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Новий пароль має бути не менше 8 символів");
      return;
    }
    if (/^\d+$/.test(newPassword)) {
      setPasswordError("Пароль не може складатися лише з цифр");
      return;
    }
    if (/^[a-zA-Zа-яА-ЯіІєЄїЇ'\u2019]+$/.test(newPassword)) {
      setPasswordError("Пароль не може складатися лише з букв — додайте цифри або символи");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Паролі не збігаються");
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("incorrect")) {
        setPasswordError("Старий пароль невірний");
      } else {
        setPasswordError(msg || "Помилка зміни пароля");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProfile();
      // Admin/Worker open on Security directly; Student opens on Profile
      setActiveTab("security");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setPasswordSuccess(false);
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
  const isStudent = !isAdmin && !isWorker;

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/auth";
  };

  // Shared password change form
  const renderSecurityContent = () => (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-bold text-foreground mb-1">Зміна пароля</h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Для безпеки використовуйте унікальний пароль не менше 8 символів.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Поточний пароль</label>
          <Input
            type="password"
            placeholder="Введіть поточний пароль"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="text-xs h-9 bg-card"
            disabled={passwordLoading}
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Новий пароль</label>
          <Input
            type="password"
            placeholder="Мін. 8 символів"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="text-xs h-9 bg-card"
            disabled={passwordLoading}
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Підтвердіть новий пароль</label>
          <Input
            type="password"
            placeholder="Повторіть новий пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="text-xs h-9 bg-card"
            disabled={passwordLoading}
            onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
          />
        </div>
      </div>

      {passwordError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5 text-red-400 shrink-0" strokeWidth={2} />
          <p className="text-[11px] text-red-400 font-medium">{passwordError}</p>
        </div>
      )}

      {passwordSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3.5 text-green-400 shrink-0" strokeWidth={2} />
          <p className="text-[11px] text-green-400 font-medium">Пароль успішно змінено!</p>
        </div>
      )}

      <Button
        size="sm"
        onClick={handleChangePassword}
        disabled={passwordLoading || !oldPassword || !newPassword || !confirmPassword}
        className="w-full h-9 text-xs font-semibold"
      >
        {passwordLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <HugeiconsIcon icon={LockPasswordIcon} className="size-3.5 mr-1.5" strokeWidth={2} />
            Змінити пароль
          </>
        )}
      </Button>

      <Separator dashed />

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/10"
        onClick={() => setLogoutConfirmOpen(true)}
      >
        <HugeiconsIcon icon={Logout01Icon} className="size-3 mr-1.5" strokeWidth={2} />
        Вийти
      </Button>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вийти з акаунту?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви дійсно хочете вийти зі свого акаунту? Вам доведеться увійти знову, щоб отримати доступ до системи.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleLogout}
            >
              Вийти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

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
          {/* User header */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-card">
            <div className="w-12 h-12 bg-muted border border-border shrink-0 overflow-hidden flex items-center justify-center">
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : photoUrl ? (
                <img src={photoUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">{userInitials}</span>
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
                        ? "text-[#b47953] bg-[#b47953]/10 border-[#b47953]/50"
                        : "text-blue-500 bg-blue-500/10 border-blue-700/50"
                    }
                  >
                    {isAdmin ? "Адмін" : isWorker ? "Працівник" : "Студент"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          {/* ── ADMIN / WORKER: Security only (no Profile tab) ── */}
          {(isAdmin || isWorker) && (
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5">
                {renderSecurityContent()}
              </div>
            </ScrollArea>
          )}

          {/* ── STUDENT: Profile + Contacts + Security ── */}
          {isStudent && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="border-b border-border px-5">
                <TabsList variant="line" className="h-9">
                  <TabsTrigger
                    value="room"
                    className="text-xs font-semibold"
                    onClick={() => setActiveTab("room")}
                  >
                    <HugeiconsIcon icon={Home01Icon} className="size-3 mr-1" strokeWidth={2} />
                    Розміщення
                  </TabsTrigger>
                  <TabsTrigger value="contacts" className="text-xs font-semibold">
                    <HugeiconsIcon icon={AiPhone01Icon} className="size-3 mr-1" strokeWidth={2} />
                    Контакти
                  </TabsTrigger>
                  <TabsTrigger value="security" className="text-xs font-semibold">
                    <HugeiconsIcon icon={LockPasswordIcon} className="size-3 mr-1" strokeWidth={2} />
                    Безпека
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-5">
                  {/* Room */}
                  <TabsContent value="room" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
                    <div className="space-y-4">
                      <div className="p-4 bg-muted border border-border rounded-lg">
                        <p className="text-xs font-semibold text-foreground mb-3">Поточне розміщення</p>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-card border border-border flex items-center justify-center shrink-0">
                              <HugeiconsIcon icon={Building03Icon} className="size-3.5 text-primary" strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-[11px] text-muted-foreground">Гуртожиток</p>
                              <p className="text-xs font-bold text-foreground">{buildingInfo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-card border border-border flex items-center justify-center shrink-0">
                              <HugeiconsIcon icon={Home01Icon} className="size-3.5 text-primary" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="text-[11px] text-muted-foreground">Кімната</p>
                              <p className="text-xs font-bold text-foreground">{roomInfo}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Contacts */}
                  <TabsContent value="contacts" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
                    <div className="space-y-5">
                      <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
                        <h4 className="text-xs font-bold text-foreground">
                          Контактні дані для майстра
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Додайте свій номер телефону, щоб майстер міг зв'язатись з вами для обговорення часу. Поле є опціональним.
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

                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground mb-3">Екстрені контакти</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 bg-muted border border-border p-4">
                            <div className="p-2 bg-card border border-border shrink-0">
                              <HugeiconsIcon icon={Briefcase01Icon} className="size-4 text-primary" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground">Комендант</p>
                              <p className="text-sm font-bold text-foreground mt-0.5">{formatPhoneNumber(buildingObj?.commandant_phone)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 bg-muted border border-border p-4">
                            <div className="p-2 bg-card border border-border shrink-0">
                              <HugeiconsIcon icon={AiPhone01Icon} className="size-4 text-primary" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground">Черговий майстер</p>
                              <p className="text-sm font-bold text-foreground mt-0.5">{CONTACT_PHONES.dutyMaster}</p>
                            </div>
                          </div>
                          <div className="p-3 border border-dashed border-border text-center">
                            <HugeiconsIcon icon={ShieldIcon} className="size-5 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
                            <p className="text-xs text-muted-foreground font-semibold">
                              Екстрені ситуації — телефонуйте 101 або 112
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
                    {renderSecurityContent()}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { SettingsModal };
