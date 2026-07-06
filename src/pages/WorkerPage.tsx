import { useEffect, useState, useMemo } from "react";
import { fetchTickets, CATEGORY_LABELS, normalizeComplaint } from "../services/problemsApi";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import LoadingSpinner from "../components/LoadingSpinner";
import { statusBadgeClass, statusLabel, priorityBadgeClass, priorityLabel, getDeadlineStatus } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import type { Complaint, Ticket } from "../lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message01Icon,
  MapPinIcon,
  InboxIcon,
  Calendar01Icon,
  ClockIcon,
  DashboardSquare01Icon,
  TaskDone01Icon,
  AlertCircleIcon,
  SearchIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import ComplaintSidePanel from "../components/ComplaintSidePanel";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { DatePicker } from "../components/ui/date-picker";
import { Separator } from "../components/ui/separator";
import { format } from "date-fns";

const priorityOptions = [
  { id: "all", name: "Всі пріоритети" },
  { id: "low", name: "Низький" },
  { id: "medium", name: "Середній" },
  { id: "high", name: "Високий" },
  { id: "critical", name: "Критичний" },
];

const deadlineSortOptions = [
  { id: "newest_assigned", name: "Найновіше призначені" },
  { id: "asc", name: "Дедлайн: спочатку найближчі" },
  { id: "desc", name: "Дедлайн: спочатку пізніші" },
];

function FilterRadioGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.id}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <RadioGroupItem value={opt.id} id={opt.id} className="size-3" />
          <span className={value === opt.id ? "text-foreground font-semibold" : ""}>
            {opt.name}
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}

const WorkerPage = () => {
  const { user: currentUser } = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<"all" | "active" | "resolved">("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [deadlineSort, setDeadlineSort] = useState("newest_assigned");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await fetchTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch worker tickets", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCardClick = (ticket: Ticket) => {
    if (!ticket.complaint_detail) return;
    const norm = normalizeComplaint(ticket.complaint_detail);
    if (norm) {
      setSelectedComplaint({
        ...norm,
        deadline: ticket.deadline,
      });
      setPanelOpen(true);
    }
  };

  // Sync side panel complaint on ticket status/comment changes
  const handlePanelStatusChange = () => {
    loadTickets();
    if (selectedComplaint) {
      // Refresh current active panel complaint details
      fetchTickets().then((data) => {
        const matchingTicket = data?.find((t: Ticket) => t.ticket_id === selectedComplaint.id || t.complaint === selectedComplaint.id);
        if (matchingTicket && matchingTicket.complaint_detail) {
          const norm = normalizeComplaint(matchingTicket.complaint_detail);
          if (norm) {
            setSelectedComplaint({
              ...norm,
              deadline: matchingTicket.deadline,
            });
          }
        }
      });
    }
  };

  const parsedTickets = useMemo(() => {
    return tickets.map((t) => {
      const comp = t.complaint_detail ? normalizeComplaint(t.complaint_detail) : null;
      return {
        ...t,
        compDetail: comp ? { ...comp, deadline: t.deadline } : null,
      };
    }).filter(t => t.compDetail !== null);
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const filtered = parsedTickets.filter((t) => {
      const comp = t.compDetail!;
      const matchesSearch =
        comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (CATEGORY_LABELS[comp.category as keyof typeof CATEGORY_LABELS] || comp.category)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const status = comp.status; // 'pending', 'approved', 'rejected', 'resolved'
      const isActive = status === "approved" || status === "pending";
      const isResolved = status === "resolved";

      if (activeStatus === "active" && !isActive) return false;
      if (activeStatus === "resolved" && !isResolved) return false;

      // Priority filter
      if (selectedPriority !== "all" && comp.priority !== selectedPriority) return false;

      // Submission date filter
      if (selectedDate) {
        const compDateStr = new Date(comp.createdAt).toLocaleDateString('en-CA');
        const filterDateStr = format(selectedDate, 'yyyy-MM-dd');
        if (compDateStr !== filterDateStr) return false;
      }

      return matchesSearch;
    });

    if (deadlineSort === "asc") {
      filtered.sort((a, b) => {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return timeA - timeB;
      });
    } else if (deadlineSort === "desc") {
      filtered.sort((a, b) => {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        if (timeA === Infinity) return 1;
        if (timeB === Infinity) return -1;
        return timeB - timeA;
      });
    } else {
      // Sort by ticket_id descending (newest assignment first)
      filtered.sort((a, b) => b.ticket_id - a.ticket_id);
    }

    return filtered;
  }, [parsedTickets, searchQuery, activeStatus, selectedPriority, selectedDate, deadlineSort]);

  const stats = useMemo(() => {
    const total = parsedTickets.length;
    const active = parsedTickets.filter(t => t.compDetail!.status === "approved" || t.compDetail!.status === "pending").length;
    const resolved = parsedTickets.filter(t => t.compDetail!.status === "resolved").length;
    return { total, active, resolved };
  }, [parsedTickets]);

  const firstName = currentUser?.first_name || "Робітник";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Панель майстра</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Вітаємо, {firstName}! Перегляд та оновлення статусів ваших призначених заявок.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-border bg-card p-6 shadow-none flex flex-col items-center justify-center text-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <HugeiconsIcon icon={DashboardSquare01Icon} className="size-5" />
          </div>
          <p className="text-3xl font-extrabold text-blue-400">{stats.total}</p>
          <p className="text-xs text-muted-foreground font-semibold">Всього призначено</p>
        </Card>
        <Card className="border-border bg-card p-6 shadow-none flex flex-col items-center justify-center text-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
          </div>
          <p className="text-3xl font-extrabold text-yellow-400">{stats.active}</p>
          <p className="text-xs text-muted-foreground font-semibold">Активні скарги</p>
        </Card>
        <Card className="border-border bg-card p-6 shadow-none flex flex-col items-center justify-center text-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
            <HugeiconsIcon icon={TaskDone01Icon} className="size-5" />
          </div>
          <p className="text-3xl font-extrabold text-green-400">{stats.resolved}</p>
          <p className="text-xs text-muted-foreground font-semibold">Вирішено</p>
        </Card>
      </div>

      {/* Filters & Tickets List Grid */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left column: Sidebar Filters */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border shadow-none bg-card">
            <CardContent className="p-4">
              <div className="relative mb-4">
                <HugeiconsIcon
                  icon={SearchIcon}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground"
                  strokeWidth={2}
                />
                <Input
                  placeholder="Пошук скарг..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                Пріоритет
              </h4>
              <FilterRadioGroup
                options={priorityOptions}
                value={selectedPriority}
                onChange={setSelectedPriority}
              />

              <Separator className="my-4" />

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                Дедлайн
              </h4>
              <FilterRadioGroup
                options={deadlineSortOptions}
                value={deadlineSort}
                onChange={setDeadlineSort}
              />

              <Separator className="my-4" />

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                Дата подання
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <DatePicker
                    date={selectedDate}
                    setDate={setSelectedDate}
                    placeholder="Оберіть дату"
                    className="flex-1"
                  />
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedDate(undefined)}
                      className="size-9 shrink-0 hover:bg-muted"
                      title="Очистити дату"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Tabs & List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-2">
            <Tabs
              value={activeStatus}
              onValueChange={(v) => setActiveStatus(v as any)}
              className="w-full sm:w-auto"
            >
              <TabsList variant="line" className="h-9">
                <TabsTrigger value="all" className="text-xs font-semibold px-4">
                  Всі ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs font-semibold px-4">
                  Активні ({stats.active})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="text-xs font-semibold px-4">
                  Вирішені ({stats.resolved})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                  <HugeiconsIcon icon={InboxIcon} className="size-5" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-bold text-foreground">Заявок не знайдено</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Немає призначених заявок, які відповідають вибраним фільтрам.
                </p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const comp = t.compDetail!;
                const catLabel = CATEGORY_LABELS[comp.category as keyof typeof CATEGORY_LABELS] || comp.category;
                
                return (
                  <Card
                    key={t.ticket_id}
                    className="border-border hover:border-blue-500/50 shadow-none bg-card p-5 cursor-pointer transition-all duration-300 group"
                    onClick={() => handleCardClick(t)}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={statusBadgeClass(comp.status)}>
                            {statusLabel(comp.status)}
                          </Badge>
                          <Badge variant="outline" className={priorityBadgeClass(comp.priority)}>
                            {priorityLabel(comp.priority)}
                          </Badge>
                        </div>
                        <span className="text-xs font-normal text-muted-foreground shrink-0 flex items-center gap-1">
                          <HugeiconsIcon icon={Calendar01Icon} className="size-3 text-muted-foreground" />
                          {new Date(comp.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-blue-400 transition-colors">
                            {comp.title || "Без назви"}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl break-all">
                            {comp.description || "Опис відсутній"}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground bg-muted px-2 py-0.5 text-[10px]">
                              {catLabel}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <HugeiconsIcon icon={MapPinIcon} className="size-3 text-muted-foreground" />
                              Корпус {comp.building}, Кімната {comp.room}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-start md:items-end justify-between self-stretch pt-2 md:pt-0">
                          {(() => {
                            const dl = getDeadlineStatus(t.deadline, comp.status === "resolved");
                            return (
                              <Badge
                                variant="outline"
                                className={`${dl.className} text-xs py-1 px-2.5 flex items-center gap-1.5`}
                              >
                                <HugeiconsIcon icon={ClockIcon} className="size-3" />
                                {dl.label}
                                {t.deadline && `: ${new Date(t.deadline).toLocaleDateString("uk-UA", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`}
                              </Badge>
                            );
                          })()}

                          <span className="text-[11px] text-blue-500 font-semibold group-hover:underline flex items-center gap-1 mt-2">
                            Детальніше
                            <HugeiconsIcon icon={Message01Icon} className="size-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {selectedComplaint && (
        <ComplaintSidePanel
          complaint={selectedComplaint}
          open={panelOpen}
          onOpenChange={setPanelOpen}
          onStatusChange={handlePanelStatusChange}
          currentUserId={currentUser?.user}
          isAdmin={false}
          isWorker={true}
          ticket={tickets.find(t => t.complaint === selectedComplaint.id)}
        />
      )}
    </div>
  );
};

export default WorkerPage;
