import { useEffect, useState } from "react";
import {
  fetchCampusStatus,
  updateCampusStatus,
  fetchBuildings,
  createBuilding,
  fetchPlaces,
  createPlace,
  updateBuilding,
  createInvite,
} from "../services/problemsApi";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon } from "@hugeicons/core-free-icons";

const AdminControlPanelPage = () => {
  const [loading, setLoading] = useState(true);
  const [water, setWater] = useState("stable");
  const [electricity, setElectricity] = useState("stable");
  const [heating, setHeating] = useState("stable");
  const [internet, setInternet] = useState("stable");
  const [elevators, setElevators] = useState("stable");
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceText, setAnnounceText] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const isAnnounceValid = announceTitle.trim() !== "" && announceText.trim() !== "";
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateBuildingConfirmOpen, setIsCreateBuildingConfirmOpen] = useState(false);
  const [isCreateRoomConfirmOpen, setIsCreateRoomConfirmOpen] = useState(false);
  const [isEditBuildingConfirmOpen, setIsEditBuildingConfirmOpen] = useState(false);


  // Buildings state
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingAddress, setNewBuildingAddress] = useState("");
  const [newBuildingPhone, setNewBuildingPhone] = useState("");
  const [savingBuilding, setSavingBuilding] = useState(false);
  const [buildingSuccessMessage, setBuildingSuccessMessage] = useState("");
  const [buildingErrorMessage, setBuildingErrorMessage] = useState("");

  // Tab within Buildings card
  const [activeControlTab, setActiveControlTab] = useState<"buildings" | "rooms">("buildings");

  // Rooms state
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [savingRoom, setSavingRoom] = useState(false);

  // Edit Building state
  const [isEditBuildingOpen, setIsEditBuildingOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any>(null);
  const [editBuildingName, setEditBuildingName] = useState("");
  const [editBuildingAddress, setEditBuildingAddress] = useState("");
  const [editBuildingPhone, setEditBuildingPhone] = useState("");
  const [updatingBuilding, setUpdatingBuilding] = useState(false);

  // Invites state
  const [inviteRole, setInviteRole] = useState<"admin" | "worker">("worker");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState("");
  const [inviteErrorMessage, setInviteErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const init = async () => {
    try {
      const [statusData, buildingsData] = await Promise.all([
        fetchCampusStatus().catch(() => null),
        fetchBuildings().catch(() => []),
      ]);
      if (statusData) {
        setWater(statusData.water_status || "stable");
        setElectricity(statusData.electricity_status || "stable");
        setHeating(statusData.heating_status || "stable");
        setInternet(statusData.internet_status || "stable");
        setElevators(statusData.elevators_status || "stable");
        setAnnounceTitle(statusData.announcement_title || "");
        setAnnounceText(statusData.announcement_text || "");
      }
      setBuildings(buildingsData);
    } catch (e) {
      console.warn("Failed to load campus status", e);
    } finally {
      setLoading(false);
      setLoadingBuildings(false);
    }
  };

  const loadRooms = async (bId: string) => {
    if (!bId) return;
    setLoadingRooms(true);
    try {
      const placesData = await fetchPlaces(Number(bId));
      setRooms(placesData || []);
    } catch (e) {
      console.warn("Failed to load rooms", e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      loadRooms(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  const handleSaveUtilities = async () => {
    setSavingStatus(true);
    try {
      await updateCampusStatus({
        water_status: water,
        electricity_status: electricity,
        heating_status: heating,
        internet_status: internet,
        elevators_status: elevators,
      });
      setSuccessMessage("Статуси комунальних систем успішно оновлено!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (e) {
      console.warn("Failed to update utilities status", e);
      setErrorMessage("Помилка при оновленні статусів систем.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAnnouncementSave = async () => {
    setSavingStatus(true);
    try {
      await updateCampusStatus({
        announcement_title: announceTitle.trim(),
        announcement_text: announceText.trim(),
      });
      setSuccessMessage("Ваше оголошення було успішно опубліковано!");
      setAnnounceTitle("");
      setAnnounceText("");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (e) {
      console.warn("Failed to save announcement", e);
      setErrorMessage("Помилка при публікації оголошення.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setSavingStatus(false);
    }
  };

  const triggerCreateBuildingConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName.trim() || !newBuildingAddress.trim()) return;
    setIsCreateBuildingConfirmOpen(true);
  };

  const handleCreateBuilding = async () => {
    setSavingBuilding(true);
    try {
      const created = await createBuilding({
        name: newBuildingName.trim(),
        address: newBuildingAddress.trim(),
        commandant_phone: newBuildingPhone.trim(),
      });
      setBuildings((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewBuildingName("");
      setNewBuildingAddress("");
      setNewBuildingPhone("");
      setBuildingSuccessMessage("Гуртожиток успішно додано!");
      setTimeout(() => setBuildingSuccessMessage(""), 5000);
    } catch (err) {
      console.warn("Failed to create building", err);
      setBuildingErrorMessage("Помилка при додаванні гуртожитку.");
      setTimeout(() => setBuildingErrorMessage(""), 5000);
    } finally {
      setSavingBuilding(false);
    }
  };

  const handleOpenEditBuilding = (b: any) => {
    setEditingBuilding(b);
    setEditBuildingName(b.name);
    setEditBuildingAddress(b.address);
    setEditBuildingPhone(b.commandant_phone || "");
    setIsEditBuildingOpen(true);
  };

  const triggerEditBuildingConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding || !editBuildingName.trim() || !editBuildingAddress.trim()) return;
    setIsEditBuildingConfirmOpen(true);
  };

  const handleUpdateBuilding = async () => {
    if (!editingBuilding) return;
    setUpdatingBuilding(true);
    try {
      const updated = await updateBuilding(editingBuilding.building_id, {
        name: editBuildingName.trim(),
        address: editBuildingAddress.trim(),
        commandant_phone: editBuildingPhone.trim(),
      });
      setBuildings((prev) =>
        prev.map((b) => (b.building_id === editingBuilding.building_id ? updated : b))
      );
      setBuildingSuccessMessage("Дані гуртожитку успішно оновлено!");
      setTimeout(() => setBuildingSuccessMessage(""), 5000);
    } catch (err) {
      console.warn("Failed to update building", err);
      setBuildingErrorMessage("Помилка при оновленні даних гуртожитку.");
      setTimeout(() => setBuildingErrorMessage(""), 5000);
      setIsEditBuildingOpen(true); // Re-open edit dialog on error
    } finally {
      setUpdatingBuilding(false);
    }
  };

  const triggerCreateRoomConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId || !newRoomName.trim()) return;
    setIsCreateRoomConfirmOpen(true);
  };

  const handleCreateRoom = async () => {
    setSavingRoom(true);
    try {
      const created = await createPlace({
        building: Number(selectedBuildingId),
        place_name: newRoomName.trim(),
      });
      setRooms((prev) => [...prev, created].sort((a, b) => a.place_name.localeCompare(b.place_name)));
      setNewRoomName("");
      setBuildingSuccessMessage("Кімнату успішно додано!");
      setTimeout(() => setBuildingSuccessMessage(""), 5000);
    } catch (err) {
      console.warn("Failed to create room", err);
      setBuildingErrorMessage("Помилка при додаванні кімнати.");
      setTimeout(() => setBuildingErrorMessage(""), 5000);
    } finally {
      setSavingRoom(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    setGeneratedLink("");
    setCopied(false);
    try {
      const res = await createInvite(inviteRole);
      const link = `${window.location.origin}/register-by-invite?token=${res.token}`;
      setGeneratedLink(link);
      setInviteSuccessMessage("Одноразове посилання успішно згенеровано!");
      setTimeout(() => setInviteSuccessMessage(""), 5000);
    } catch (err) {
      console.warn("Failed to generate invite", err);
      setInviteErrorMessage("Помилка при генерації посилання.");
      setTimeout(() => setInviteErrorMessage(""), 5000);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {loading ? (
            <div className="border border-border bg-card p-6 rounded-xl animate-pulse h-96" />
          ) : (
            <>
              <Card className="border-border bg-card p-6 shadow-none">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  📢 Керування статусом систем та оголошеннями
                </h2>

                {successMessage && (
                  <div className="mb-6 p-4 border border-green-500/20 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg shadow-sm animate-fade-in flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-400 font-bold ml-2">×</button>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 text-destructive text-xs font-bold rounded-lg shadow-sm animate-fade-in flex items-center justify-between">
                    <span>⚠️ {errorMessage}</span>
                    <button onClick={() => setErrorMessage("")} className="text-destructive hover:text-destructive/80 font-bold ml-2">×</button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Utilities dropdowns */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      ⚡ Статус комунальних систем
                    </h3>
                    <Card className="border border-border/50 bg-muted/20 p-4 rounded-lg space-y-3 shadow-none">
                      <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-border/40">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className="text-sm">💧</span>
                          <span>Водопостачання</span>
                        </div>
                        <Select value={water} onValueChange={setWater}>
                          <SelectTrigger className="w-32 h-8 text-xs bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stable">🟢 Стабільно</SelectItem>
                            <SelectItem value="warning">🟡 Ремонт</SelectItem>
                            <SelectItem value="critical">🔴 Аварія</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-border/40">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className="text-sm">⚡</span>
                          <span>Електромережа</span>
                        </div>
                        <Select value={electricity} onValueChange={setElectricity}>
                          <SelectTrigger className="w-32 h-8 text-xs bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stable">🟢 Стабільно</SelectItem>
                            <SelectItem value="warning">🟡 Ремонт</SelectItem>
                            <SelectItem value="critical">🔴 Аварія</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-border/40">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className="text-sm">🌡️</span>
                          <span>Опалення</span>
                        </div>
                        <Select value={heating} onValueChange={setHeating}>
                          <SelectTrigger className="w-32 h-8 text-xs bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stable">🟢 Стабільно</SelectItem>
                            <SelectItem value="warning">🟡 Ремонт</SelectItem>
                            <SelectItem value="critical">🔴 Аварія</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-border/40">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className="text-sm">🌐</span>
                          <span>Інтернет</span>
                        </div>
                        <Select value={internet} onValueChange={setInternet}>
                          <SelectTrigger className="w-32 h-8 text-xs bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stable">🟢 Стабільно</SelectItem>
                            <SelectItem value="warning">🟡 Ремонт</SelectItem>
                            <SelectItem value="critical">🔴 Аварія</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between gap-4 pb-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span className="text-sm">🛗</span>
                          <span>Ліфти</span>
                        </div>
                        <Select value={elevators} onValueChange={setElevators}>
                          <SelectTrigger className="w-32 h-8 text-xs bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stable">🟢 Стабільно</SelectItem>
                            <SelectItem value="warning">🟡 Ремонт</SelectItem>
                            <SelectItem value="critical">🔴 Аварія</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            className="w-full text-xs font-bold h-9 bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm mt-1"
                            disabled={savingStatus}
                          >
                            {savingStatus ? "Збереження..." : "Оновити статуси систем"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Змінити статус комунальних систем?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Ви дійсно хочете змінити статус комунальної системи? Нові значення будуть відображені для всіх студентів на головній сторінці.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Скасувати</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSaveUtilities}>Оновити</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </Card>
                  </div>

                  {/* Announcement text form */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      📢 Дошка оголошень
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Заголовок</label>
                        <Input
                          placeholder="Наприклад: Технічні роботи"
                          value={announceTitle}
                          onChange={(e) => setAnnounceTitle(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Опис оголошення</label>
                        <textarea
                          placeholder="Введіть опис важливого оголошення для студентів..."
                          value={announceText}
                          onChange={(e) => setAnnounceText(e.target.value)}
                          rows={3}
                          className="w-full text-xs bg-card border border-border p-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="w-full text-xs font-semibold h-9" 
                            disabled={savingStatus || !isAnnounceValid}
                          >
                            {savingStatus ? "Збереження..." : "Опублікувати оголошення"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Опублікувати оголошення?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Ви дійсно хочете опублікувати оголошення? Воно буде відправлено на головну сторінку всіх студентів.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Скасувати</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAnnouncementSave}>Опублікувати</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Buildings & Rooms Management card */}
              <Card className="border-border bg-card p-6 shadow-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    🏢 Керування корпусами та кімнатами гуртожитків
                  </h2>
                  <div className="bg-muted p-1 rounded-lg flex gap-1 w-fit">
                    <Button
                      variant={activeControlTab === "buildings" ? "secondary" : "ghost"}
                      size="sm"
                      className="text-xs h-7 px-3 font-semibold"
                      onClick={() => setActiveControlTab("buildings")}
                    >
                      Гуртожитки (Корпуси)
                    </Button>
                    <Button
                      variant={activeControlTab === "rooms" ? "secondary" : "ghost"}
                      size="sm"
                      className="text-xs h-7 px-3 font-semibold"
                      onClick={() => setActiveControlTab("rooms")}
                    >
                      Кімнати
                    </Button>
                  </div>
                </div>

                {buildingSuccessMessage && (
                  <div className="mb-6 p-4 border border-green-500/20 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg shadow-sm animate-fade-in flex items-center justify-between">
                    <span>{buildingSuccessMessage}</span>
                    <button onClick={() => setBuildingSuccessMessage("")} className="text-green-500 hover:text-green-400 font-bold ml-2">×</button>
                  </div>
                )}

                {buildingErrorMessage && (
                  <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 text-destructive text-xs font-bold rounded-lg shadow-sm animate-fade-in flex items-center justify-between">
                    <span>⚠️ {buildingErrorMessage}</span>
                    <button onClick={() => setBuildingErrorMessage("")} className="text-destructive hover:text-destructive/80 font-bold ml-2">×</button>
                  </div>
                )}

                {activeControlTab === "buildings" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Buildings list */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        🏢 Наявні корпуси
                      </h3>
                      {loadingBuildings ? (
                        <div className="h-48 border border-border bg-muted/20 animate-pulse rounded-lg" />
                      ) : buildings.length === 0 ? (
                        <div className="p-8 border border-dashed border-border text-center rounded-lg">
                          <p className="text-xs text-muted-foreground font-semibold">Гуртожитків поки не додано.</p>
                        </div>
                      ) : (
                        <div className="border border-border/50 bg-muted/20 rounded-lg p-2 max-h-[300px] overflow-y-auto space-y-2">
                          {buildings.map((b) => (
                            <div key={b.building_id} className="p-3 bg-card border border-border rounded-md flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground">{b.name}</p>
                                <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground/75">Адреса:</span> {b.address}</p>
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground/75">Комендант:</span> {b.commandant_phone || "Не вказано"}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground hover:text-foreground border border-border bg-card"
                                onClick={() => handleOpenEditBuilding(b)}
                              >
                                <HugeiconsIcon icon={Edit02Icon} className="size-3.5" strokeWidth={2} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Create building form */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        ➕ Додати новий корпус
                      </h3>
                      <form onSubmit={triggerCreateBuildingConfirm} className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">Назва / Номер корпусу</label>
                          <Input
                            placeholder="Наприклад: Гуртожиток №15"
                            value={newBuildingName}
                            onChange={(e) => setNewBuildingName(e.target.value)}
                            className="h-9 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">Адреса корпусу</label>
                          <Input
                            placeholder="Наприклад: вул. Лукаша, 1"
                            value={newBuildingAddress}
                            onChange={(e) => setNewBuildingAddress(e.target.value)}
                            className="h-9 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">Телефон коменданта</label>
                          <Input
                            placeholder="Наприклад: 0671234567"
                            value={newBuildingPhone}
                            onChange={(e) => setNewBuildingPhone(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <Button 
                          type="submit"
                          size="sm" 
                          className="w-full text-xs font-semibold h-9" 
                          disabled={savingBuilding || !newBuildingName.trim() || !newBuildingAddress.trim()}
                        >
                          {savingBuilding ? "Додавання..." : "Додати гуртожиток"}
                        </Button>

                        <AlertDialog open={isCreateBuildingConfirmOpen} onOpenChange={setIsCreateBuildingConfirmOpen}>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Додати новий гуртожиток?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ви дійсно хочете створити новий гуртожиток з назвою "{newBuildingName}" за адресою "{newBuildingAddress}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setIsCreateBuildingConfirmOpen(false)}>Скасувати</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                setIsCreateBuildingConfirmOpen(false);
                                handleCreateBuilding();
                              }}>
                                Додати
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rooms list */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                          Оберіть гуртожиток
                        </label>
                        <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                          <SelectTrigger className="w-full h-9 text-xs bg-card">
                            <SelectValue placeholder="Оберіть гуртожиток..." />
                          </SelectTrigger>
                          <SelectContent>
                            {buildings.map((b) => (
                              <SelectItem key={b.building_id} value={String(b.building_id)}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-2">
                          🚪 Список кімнат
                        </h3>
                        {!selectedBuildingId ? (
                          <div className="p-8 border border-dashed border-border text-center rounded-lg">
                            <p className="text-xs text-muted-foreground font-semibold">
                              Оберіть гуртожиток зі списку, щоб переглянути кімнати.
                            </p>
                          </div>
                        ) : loadingRooms ? (
                          <div className="h-32 border border-border bg-muted/20 animate-pulse rounded-lg" />
                        ) : rooms.length === 0 ? (
                          <div className="p-8 border border-dashed border-border text-center rounded-lg">
                            <p className="text-xs text-muted-foreground font-semibold">
                              У цьому корпусі поки немає кімнат. Додайте першу кімнату справа!
                            </p>
                          </div>
                        ) : (
                          <div className="border border-border/50 bg-muted/20 rounded-lg p-2 max-h-[220px] overflow-y-auto grid grid-cols-3 gap-2">
                            {rooms.map((r) => (
                              <div key={r.place_id} className="p-2 bg-card border border-border rounded-md text-center text-xs font-bold text-foreground">
                                {r.place_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Room form */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        ➕ Додати нову кімнату
                      </h3>
                      <form onSubmit={triggerCreateRoomConfirm} className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">Номер або назва кімнати</label>
                          <Input
                            placeholder="Наприклад: 105, 312а або Кухня 1 поверху"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="h-9 text-xs"
                            required
                            disabled={!selectedBuildingId}
                          />
                        </div>
                        <Button 
                          type="submit"
                          size="sm" 
                          className="w-full text-xs font-semibold h-9" 
                          disabled={savingRoom || !selectedBuildingId || !newRoomName.trim()}
                        >
                          {savingRoom ? "Додавання..." : "Додати кімнату"}
                        </Button>

                        <AlertDialog open={isCreateRoomConfirmOpen} onOpenChange={setIsCreateRoomConfirmOpen}>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Додати нову кімнату?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ви дійсно хочете додати кімнату "{newRoomName}" до вибраного гуртожитку?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setIsCreateRoomConfirmOpen(false)}>Скасувати</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                setIsCreateRoomConfirmOpen(false);
                                handleCreateRoom();
                              }}>
                                Додати
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </form>
                    </div>
                  </div>
                )}
              </Card>

              {/* One-Time Registration Invites card */}
              <Card className="border-border bg-card p-6 shadow-none">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  🎟️ Одноразові посилання для реєстрації персоналу
                </h2>
                
                {inviteSuccessMessage && (
                  <div className="mb-6 p-4 border border-green-500/20 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg shadow-sm animate-fade-in flex items-center justify-between">
                    <span>{inviteSuccessMessage}</span>
                    <button onClick={() => setInviteSuccessMessage("")} className="text-green-500 hover:text-green-400 font-bold ml-2">×</button>
                  </div>
                )}

                {inviteErrorMessage && (
                  <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 text-destructive text-xs font-bold rounded-lg shadow-sm animate-fade-in flex items-center justify-between">
                    <span>⚠️ {inviteErrorMessage}</span>
                    <button onClick={() => setInviteErrorMessage("")} className="text-destructive hover:text-destructive/80 font-bold ml-2">×</button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side: Generator */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                        Тип акаунту для запрошення
                      </label>
                      <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                        <SelectTrigger className="w-full h-9 text-xs bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worker">Працівник</SelectItem>
                          <SelectItem value="admin">Адміністратор</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleGenerateInvite}
                      disabled={generatingInvite}
                      className="w-full text-xs font-semibold h-9"
                    >
                      {generatingInvite ? "Генерація..." : "Згенерувати одноразове посилання"}
                    </Button>

                    {generatedLink && (
                      <div className="space-y-2 pt-2 animate-fade-in">
                        <label className="text-xs font-semibold text-foreground">Згенероване посилання:</label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={generatedLink}
                            className="text-xs h-9 bg-muted cursor-default"
                          />
                          <Button
                            size="sm"
                            className="h-9 text-xs font-semibold px-4 shrink-0"
                            onClick={handleCopyLink}
                          >
                            {copied ? "Скопійовано!" : "Копіювати"}
                          </Button>
                        </div>
                        <p className="text-[10px] text-amber-500 font-semibold">
                          ⚠️ Це посилання є одноразовим і перестане працювати після успішної реєстрації.
                        </p>
                        {copied && (
                          <p className="text-[10px] text-green-500 font-semibold animate-fade-in">
                            📋 Скопійовано! Надішліть це посилання новому співробітнику. Зверніть увагу: посилання є одноразовим і перестане працювати після першої успішної реєстрації.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side: Informational instructions */}
                  <div className="p-4 bg-muted/40 border border-border/50 rounded-lg space-y-3 flex flex-col justify-center">
                    <h3 className="text-xs font-bold text-foreground">📌 Як це працює?</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Щоб уникнути публічної реєстрації для адміністраторів або працівників, ви можете згенерувати це спеціальне високозахищене одноразове посилання.
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Надішліть це посилання новому співробітнику. Перейшовши за ним, він зможе заповнити форму реєстрації (ім'я, прізвище, email на домені @lpnu.ua та пароль), і його акаунт автоматично отримає вибрані права.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>



      {/* Dialog for editing building */}
      <Dialog open={isEditBuildingOpen} onOpenChange={setIsEditBuildingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редагувати гуртожиток</DialogTitle>
          </DialogHeader>
          <form onSubmit={triggerEditBuildingConfirm} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Назва / Номер корпусу</label>
              <Input
                value={editBuildingName}
                onChange={(e) => setEditBuildingName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Адреса корпусу</label>
              <Input
                value={editBuildingAddress}
                onChange={(e) => setEditBuildingAddress(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Телефон коменданта</label>
              <Input
                value={editBuildingPhone}
                onChange={(e) => setEditBuildingPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditBuildingOpen(false)}>
                Скасувати
              </Button>
              <Button type="submit" size="sm" disabled={updatingBuilding}>
                {updatingBuilding ? "Збереження..." : "Зберегти зміни"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isEditBuildingConfirmOpen} onOpenChange={setIsEditBuildingConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Зберегти зміни гуртожитку?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви дійсно хочете оновити дані цього гуртожитку?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsEditBuildingConfirmOpen(false)}>
              Скасувати
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsEditBuildingConfirmOpen(false);
              setIsEditBuildingOpen(false);
              handleUpdateBuilding();
            }}>
              Зберегти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminControlPanelPage;
