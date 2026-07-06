import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAllComplaints,
  fetchTickets,
  fetchCampusStatus,
  updateCampusStatus,
} from "../services/problemsApi";
import ComplaintSidePanel from "../components/ComplaintSidePanel";
import { NotificationBell } from "../components/NotificationBell";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ExportTicketsModal } from "../components/ExportTicketsModal";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, AlertCircleIcon, DashboardSquare01Icon, TaskDone01Icon, Ticket01Icon } from "@hugeicons/core-free-icons";
import { statusBadgeClass, statusLabel } from "../lib/complaintUtils";
import { CATEGORY_LABELS } from "../services/problemsApi";
import { useUser } from "../context/UserContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
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
import TicketCreateForm from "../components/TicketCreateForm";

const AdminPage = () => {
  const { user: currentUser } = useUser();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

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

  const init = async () => {
    try {
      const [complaintsData, ticketsData, statusData] = await Promise.all([
        fetchAllComplaints(),
        fetchTickets(),
        fetchCampusStatus().catch(() => null),
      ]);
      setComplaints(complaintsData);
      setTickets(ticketsData);
      if (statusData) {
        setWater(statusData.water_status || "stable");
        setElectricity(statusData.electricity_status || "stable");
        setHeating(statusData.heating_status || "stable");
        setInternet(statusData.internet_status || "stable");
        setElevators(statusData.elevators_status || "stable");
        setAnnounceTitle(statusData.announcement_title || "");
        setAnnounceText(statusData.announcement_text || "");
      }
    } catch (e) {
      console.warn("Failed to load admin dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

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
      setSuccessMessage("Помилка при оновленні статусів систем.");
      setTimeout(() => setSuccessMessage(""), 5000);
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
      setSuccessMessage("Помилка при публікації оголошення.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } finally {
      setSavingStatus(false);
    }
  };

  useEffect(() => {
    init();
    
    window.addEventListener("adminComplaintUpdated", init);
    return () => window.removeEventListener("adminComplaintUpdated", init);
  }, []);

  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "approved").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const handleRowClick = (complaint: any) => {
    setSelectedComplaint(complaint);
    setSheetOpen(true);
  };

  const handleRefresh = async () => {
    const data = await fetchAllComplaints();
    setComplaints(data);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="h-16 bg-card flex items-center justify-between px-6 lg:px-8 shrink-0">
          <h1 className="text-2xl font-bold text-foreground">Інформаційна панель</h1>
          <div className="flex items-center gap-3">
            <NotificationBell onSelectComplaint={(c) => {
              setSelectedComplaint(c);
              setSheetOpen(true);
            }} />
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              onClick={() => setIsExportModalOpen(true)}
            >
              <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={2} />
              Експорт даних
            </Button>
            <Button
              size="default"
              className="gap-2"
              onClick={() => setIsTicketModalOpen(true)}
            >
              <HugeiconsIcon icon={Ticket01Icon} className="size-5" strokeWidth={2} />
              Призначити працівника
            </Button>
          </div>
        </header>
        <Separator />

        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-border bg-card p-6 flex flex-col items-center justify-center text-center gap-3 animate-pulse rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-muted/50" />
                    <div className="h-8 w-12 bg-muted/50" />
                    <div className="h-3 w-16 bg-muted/50" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-border bg-card p-6 shadow-none flex flex-col items-center justify-center text-center gap-3 rounded-xl hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-red-500">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground font-semibold">Очікує</p>
                </Card>
                <Card className="border border-border bg-card p-6 shadow-none flex flex-col items-center justify-center text-center gap-3 rounded-xl hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <HugeiconsIcon icon={DashboardSquare01Icon} className="size-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-yellow-500">{inProgressCount}</p>
                  <p className="text-xs text-muted-foreground font-semibold">Активно</p>
                </Card>
                <Card className="border border-border bg-card p-6 shadow-none flex flex-col items-center justify-center text-center gap-3 rounded-xl hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                    <HugeiconsIcon icon={TaskDone01Icon} className="size-5" />
                  </div>
                  <p className="text-3xl font-extrabold text-green-500">{resolvedCount}</p>
                  <p className="text-xs text-muted-foreground font-semibold">Вирішено</p>
                </Card>
              </div>
            )}

            {/* Campus Utility & Announcement Control Panel */}
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

            <div className="bg-card border border-border overflow-hidden">
              <div className="px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">Останні скарги</h2>
                <Link to="/admin/complaints" className="text-sm font-semibold text-blue-500 hover:text-blue-400">
                  Всі скарги
                </Link>
              </div>
              <Separator />
              <Table className="text-left border-collapse">
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b border-border text-sm text-muted-foreground">
                    <TableHead className="px-6 py-3 font-semibold">Проблема</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Категорія</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Дата подання</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-base divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell className="px-6 py-4">
                          <div className="h-5 w-3/4 bg-muted/50 mb-1" />
                          <div className="h-4 w-1/2 bg-muted/30" />
                        </TableCell>
                        <TableCell className="px-6 py-4"><div className="h-5 w-1/3 bg-muted/50" /></TableCell>
                        <TableCell className="px-6 py-4"><div className="h-5 w-1/2 bg-muted/50" /></TableCell>
                        <TableCell className="px-6 py-4"><div className="h-6 w-1/4 bg-muted/50" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentComplaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-6 py-8 text-center">
                        <p className="text-sm text-muted-foreground">Заявок поки немає.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentComplaints.map((c) => (
                      <TableRow
                        key={c.id}
                        className={`group relative bg-card hover:bg-muted/50 transition-colors cursor-pointer !border-l-4 ${
                          c.priority === "critical" ? "!border-l-red-600" :
                          c.priority === "high" ? "!border-l-orange-500" :
                          c.priority === "medium" ? "!border-l-yellow-500" : "!border-l-green-500"
                        }`}
                        onClick={() => handleRowClick(c)}
                      >
                        <TableCell className="px-6 py-4">
                          <p className="font-semibold text-foreground">
                            {c.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5 break-all whitespace-pre-wrap">
                            {c.description}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-muted-foreground font-semibold">
                          {CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant="outline" className={statusBadgeClass(c.status)}>
                            {statusLabel(c.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

      <ComplaintSidePanel
        complaint={selectedComplaint}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
        }}
        onStatusChange={handleRefresh}
        currentUserId={currentUser?.user}
        isAdmin={true}
        ticket={tickets.find(t => t.complaint === selectedComplaint?.id)}
      />

      <ExportTicketsModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />

      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Призначити працівника</DialogTitle>
          </DialogHeader>
          <TicketCreateForm
            onClose={() => setIsTicketModalOpen(false)}
            onSaved={() => {
              setIsTicketModalOpen(false);
              init();
              window.dispatchEvent(new Event("adminComplaintUpdated"));
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
