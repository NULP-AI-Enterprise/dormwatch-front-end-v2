import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyProblems,
  deleteProblem,
  CATEGORY_LABELS,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TicketCard } from "../components/TicketCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { statusBadgeClass, statusLabel, priorityBadgeClass, priorityLabel } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import type { Complaint } from "../lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete01Icon,
  Message01Icon,
  MapPinIcon,
  InboxIcon,
  File01Icon,
  AddIcon,
  TaskDone01Icon,
  AlertCircleIcon,
  SearchIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import ComplaintSidePanel from "../components/ComplaintSidePanel";



const UserPage = () => {
  const { user: currentUser } = useUser();
  const [problems, setProblems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatus, setReportStatus] = useState("all");
  const [reportCategory, setReportCategory] = useState("all");

  const loadMyProblems = async () => {
    setLoading(true);
    try {
      const data = await fetchMyProblems();
      setProblems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch user data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyProblems();
  }, []);

  const onDelete = async (id: number) => {
    try {
      await deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
      if (selectedComplaint?.id === id) {
        setSheetOpen(false);
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.warn('Failed to delete problem', err);
    }
  };

  const activeComplaints = problems.filter((p) => 
    p.status === "pending" || p.status === "approved" || p.status === "active" || p.status === "published"
  );


  const filteredReports = problems.filter((p) => {
    const matchesSearch =
      reportSearch === "" ||
      (p.title || "").toLowerCase().includes(reportSearch.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(reportSearch.toLowerCase());
      
    const matchesStatus =
      reportStatus === "all" ||
      (reportStatus === "pending" && p.status === "pending") ||
      (reportStatus === "active" && (p.status === "approved" || p.status === "active" || p.status === "published")) ||
      (reportStatus === "resolved" && p.status === "resolved") ||
      (reportStatus === "rejected" && (p.status === "rejected" || p.status === "denied"));
      
    const matchesCategory =
      reportCategory === "all" || p.category === reportCategory;
      
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const firstName = currentUser?.first_name || "User";
  const building = currentUser?.place?.building?.name || "";
  const room = currentUser?.place?.place_name || "";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse space-y-8">
        {/* Tab switchers skeleton */}
        <div className="bg-muted/40 w-52 h-9 rounded-xl border border-border/50" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            {/* Profile heading skeleton */}
            <div className="space-y-2.5">
              <div className="h-8 bg-muted/60 w-3/4 rounded-lg" />
              <div className="h-4 bg-muted/40 w-1/2 rounded-md" />
            </div>

            {/* Banner link skeleton */}
            <div className="h-20 bg-muted/45 rounded-xl border border-border/40" />

            {/* Quick action button skeleton */}
            <div className="h-9 bg-muted/65 rounded-lg" />

            {/* Quick tips skeleton */}
            <div className="border border-border/60 p-5 space-y-4 rounded-xl">
              <div className="h-4 bg-muted/50 w-1/3 rounded" />
              <div className="space-y-3">
                <div className="h-16 bg-muted/40 rounded-lg" />
                <div className="h-16 bg-muted/40 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* Header skeleton */}
            <div className="h-6 bg-muted/60 w-1/4 rounded" />

            {/* Active complaints skeletons */}
            <div className="space-y-3">
              <div className="h-24 bg-muted/40 border border-border/40 rounded-xl" />
              <div className="h-24 bg-muted/40 border border-border/40 rounded-xl" />
              <div className="h-24 bg-muted/40 border border-border/40 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-xl border border-border h-auto inline-flex gap-1 mb-8">
            <TabsTrigger
              value="dashboard"
              className="px-6 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              Загальний огляд
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="px-6 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              Мої заявки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Вітаємо, {firstName}!</h1>
                  {building || room ? (
                    <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                      <HugeiconsIcon icon={MapPinIcon} className="size-4 text-muted-foreground" strokeWidth={1.5} />
                      <span>{building || "Гуртожиток"}</span>
                      {room && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-border inline-block mx-0.5" />
                          <span>Кімната {room}</span>
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-1 flex items-center gap-2 text-xs italic">
                      <HugeiconsIcon icon={MapPinIcon} className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
                      Вкажіть адресу в профілі
                    </p>
                  )}
                </div>

                <Card className="relative overflow-hidden border border-blue-500/20 bg-blue-500/5 p-4 shadow-none flex items-center justify-between gap-4 transition-all hover:bg-blue-500/10 group cursor-pointer">
                  <Link to="/home" className="absolute inset-0 z-10" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🏠</span>
                    <div>
                      <h3 className="font-bold text-xs text-blue-400">Головна сторінка студента</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        Стан систем кампусу, новини та корисні контакти
                      </p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:translate-x-1 transition-transform text-xs">
                    ➔
                  </div>
                </Card>



                <Button asChild className="w-full">
                  <Link to="/create-report">
                    <HugeiconsIcon icon={AddIcon} className="size-4 mr-2" strokeWidth={2} />
                    Створити заявку
                  </Link>
                </Button>
                {/* Швидкі поради Widget */}
                <Card className="border-border shadow-none bg-card p-5 space-y-4">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    💡 Швидкі поради
                  </h3>
                  <div className="space-y-3 text-[11px] text-muted-foreground leading-relaxed">
                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                      <p className="font-bold text-foreground mb-1">🚰 Протікає вода?</p>
                      Перекрийте локальний вентиль під раковиною чи унітазом і негайно створіть заявку з пріоритетом «Критичний».
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                      <p className="font-bold text-foreground mb-1">🔌 Немає світла?</p>
                      Перевірте автомати в коридорі або зверніться до чергового. Якщо збій локальний — створіть заявку в категорію «Електрика».
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                      <p className="font-bold text-foreground mb-1">📸 Додавайте фото</p>
                      Заявки з чіткими фотографіями проблеми майстри приймають в роботу та вирішують значно швидше.
                    </div>
                  </div>
                </Card>
              </div>

              <div className="md:col-span-2 space-y-6">


                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Активні заявки</h2>
                </div>
                <div className="space-y-3">
                  {activeComplaints.length === 0 ? (
                    <div className="border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                        <HugeiconsIcon icon={InboxIcon} className="size-5" strokeWidth={1.5} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Немає активних заявок.</p>
                      <Button asChild size="xs">
                        <Link to="/create-report"><HugeiconsIcon icon={AddIcon} className="size-4 mr-1.5" strokeWidth={2} />Створити першу заявку</Link>
                      </Button>
                    </div>
                  ) : (
                    activeComplaints.slice(0, 5).map((p) => (
                      <TicketCard
                        key={p.id}
                        id={p.id}
                        title={p.title}
                        description={p.description}
                        category={p.category}
                        date={new Date(p.createdAt).toLocaleDateString()}
                        status={p.status}
                        categoryLabel={CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS]}
                        onClick={() => {
                          setSelectedComplaint(p);
                          setSheetOpen(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" id="reports-filter-section">
            <div className="space-y-6">
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* 1. Всього звернень */}
                <Card className="p-4 bg-card border border-border shadow-none flex flex-col items-center justify-center text-center hover:border-blue-500/20 transition-colors rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                    <HugeiconsIcon icon={File01Icon} className="size-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Всього звернень
                  </span>
                  <span className="text-2xl font-black text-blue-500 mt-1">
                    {problems.length}
                  </span>
                </Card>

                {/* 2. Очікують */}
                <Card className="p-4 bg-card border border-border shadow-none flex flex-col items-center justify-center text-center hover:border-red-500/20 transition-colors rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                    <HugeiconsIcon icon={AlertCircleIcon} className="size-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Очікують
                  </span>
                  <span className="text-2xl font-black text-red-500 mt-1">
                    {problems.filter(p => p.status === 'pending').length}
                  </span>
                </Card>

                {/* 3. У роботі */}
                <Card className="p-4 bg-card border border-border shadow-none flex flex-col items-center justify-center text-center hover:border-yellow-500/20 transition-colors rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-2">
                    <HugeiconsIcon icon={InboxIcon} className="size-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    У роботі
                  </span>
                  <span className="text-2xl font-black text-yellow-500 mt-1">
                    {problems.filter(p => p.status === 'approved' || p.status === 'active' || p.status === 'published').length}
                  </span>
                </Card>

                {/* 4. Вирішено */}
                <Card className="p-4 bg-card border border-border shadow-none flex flex-col items-center justify-center text-center hover:border-green-500/20 transition-colors rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
                    <HugeiconsIcon icon={TaskDone01Icon} className="size-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Вирішено
                  </span>
                  <span className="text-2xl font-black text-green-500 mt-1">
                    {problems.filter(p => p.status === 'resolved').length}
                  </span>
                </Card>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border bg-card rounded-xl shadow-none">
                <div className="relative flex-1 max-w-xs">
                  <HugeiconsIcon icon={SearchIcon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" strokeWidth={2} />
                  <Input
                    placeholder="Пошук заявок..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="pl-8 text-xs h-8 shadow-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Select value={reportStatus} onValueChange={setReportStatus}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-card shadow-none">
                      <SelectValue placeholder="Всі статуси" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі статуси</SelectItem>
                      <SelectItem value="pending">Очікують</SelectItem>
                      <SelectItem value="active">Активні</SelectItem>
                      <SelectItem value="resolved">Вирішені</SelectItem>
                      <SelectItem value="rejected">Відхилені</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={reportCategory} onValueChange={setReportCategory}>
                    <SelectTrigger className="w-36 h-8 text-xs bg-card shadow-none">
                      <SelectValue placeholder="Всі категорії" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі категорії</SelectItem>
                      <SelectItem value="plumbing">Сантехніка</SelectItem>
                      <SelectItem value="electricity">Електрика</SelectItem>
                      <SelectItem value="furniture">Меблі</SelectItem>
                      <SelectItem value="internet">Інтернет</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* List */}
              <div className="space-y-4">
                {filteredReports.length === 0 ? (
                  <div className="border border-dashed border-border p-12 flex flex-col items-center justify-center text-center rounded-xl bg-card/30">
                    <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground rounded-lg">
                      <HugeiconsIcon icon={File01Icon} className="size-5" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {problems.length === 0 ? "Ще немає звернень" : "Нічого не знайдено за фільтрами"}
                    </p>
                  </div>
                ) : (
                  filteredReports.map((p) => (
                    <Card key={p.id} className="border border-border/80 shadow-none bg-card p-5 hover:-translate-y-0.5 hover:shadow-md hover:border-border transition-all duration-300 rounded-xl relative overflow-hidden group">
                      <div>
                        {/* Header metadata row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border/40 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={`${statusBadgeClass(p.status)} rounded-md font-semibold`}>
                              {statusLabel(p.status)}
                            </Badge>
                            <Badge variant="outline" className={`${priorityBadgeClass(p.priority)} rounded-md font-medium text-[10px]`}>
                              {priorityLabel(p.priority)}
                            </Badge>
                          </div>
                          <span className="text-xs font-normal text-muted-foreground shrink-0 flex items-center gap-1.5">
                            <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[10px]">
                              {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category || ""}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-border" />
                            <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                          </span>
                        </div>

                        {/* Content */}
                        <h3 className="text-sm font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                          {p.title || "Без назви"}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4 break-all whitespace-pre-wrap">
                          {p.description || "Опис відсутній"}
                        </p>

                        {/* Image attachment */}
                        {p.photoUrl && (
                          <div className="w-full h-48 overflow-hidden border border-border/70 mb-4 rounded-lg bg-muted/20">
                            <img
                              src={resolveImageUrl(p.thumbnail || p.photoUrl)}
                              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                              alt=""
                            />
                          </div>
                        )}

                        {/* Assigned Master Box */}
                        {p.assignedWorker && (
                          <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border/50 rounded-lg mb-4 text-xs">
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                              {p.assignedWorker.first_name?.[0] || "👷"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-[11px] text-foreground leading-none mb-1">Призначено робітника</p>
                              <p className="text-muted-foreground text-[11px] leading-tight truncate">{p.assignedWorker.first_name} {p.assignedWorker.last_name}</p>
                            </div>
                            {p.assignedWorker.contact_info && (
                              <a
                                href={`tel:${p.assignedWorker.contact_info}`}
                                className="ml-auto text-[11px] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded hover:bg-primary/20 transition-all shrink-0"
                              >
                                📞 Зателефонувати
                              </a>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-3 mt-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setSelectedComplaint(p);
                              setSheetOpen(true);
                            }}
                            className="text-primary text-xs font-bold hover:underline inline-flex items-center gap-2 p-0 h-auto"
                          >
                            <HugeiconsIcon icon={Message01Icon} className="size-3.5" strokeWidth={2} />
                            <span>Детальніше & коментарі</span>
                            {p.commentsCount > 0 && (
                              <span className="bg-primary/15 text-primary text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                                {p.commentsCount}
                              </span>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDelete(p.id)}
                            className="text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors rounded-lg"
                          >
                            <HugeiconsIcon icon={Delete01Icon} className="size-3.5" strokeWidth={2} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {selectedComplaint && (
          <ComplaintSidePanel
            complaint={selectedComplaint}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onStatusChange={loadMyProblems}
            currentUserId={currentUser?.id}
            isAdmin={false}
            isWorker={false}
          />
        )}
      </div>
  );
};

export default UserPage;
