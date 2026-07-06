import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DatePicker } from "../components/ui/date-picker";
import { format } from "date-fns";
import {
  fetchAllComplaints,
  fetchApprovedComplaints,
  updateComplaintStatus,
  deleteProblem,
  CATEGORY_LABELS,
  fetchTickets,
  fetchEmployees,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import ComplaintSidePanel from "../components/ComplaintSidePanel";
import TicketCreateForm from "../components/TicketCreateForm";
import { NotificationBell } from "../components/NotificationBell";
import { useUser } from "../context/UserContext";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../components/ui/dialog";
import LoadingSpinner from "../components/LoadingSpinner";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

import { Separator } from "../components/ui/separator";
import { statusBadgeClass, statusLabel, priorityBadgeClass, priorityLabel } from "../lib/complaintUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SearchIcon,
  Delete01Icon,
  EditIcon,
  Cancel01Icon,
  InboxIcon,
  CheckmarkCircleIcon,
  CancelCircleIcon,
  AddIcon,
  MoreHorizontalIcon,
  Download01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import type { Complaint, Ticket, Employee } from "../lib/types";
import { ExportTicketsModal } from "../components/ExportTicketsModal";

const categoryOptions = [
  { id: "all", name: "Всі категорії" },
  { id: "plumbing", name: "Сантехніка" },
  { id: "electricity", name: "Електрика" },
  { id: "furniture", name: "Меблі" },
  { id: "internet", name: "Інтернет" },
];

const statusOptions = [
  { id: "pending", name: "Очікує" },
  { id: "approved", name: "Активно" },
  { id: "rejected", name: "Відхилено" },
  { id: "resolved", name: "Вирішено" },
];

const ticketStatusOptions = [
  { id: "all", name: "Всі" },
  { id: "not_created", name: "Без тікета" },
  { id: "created", name: "З тікетом" },
];

const priorityOptions = [
  { id: "all", name: "Всі пріоритети" },
  { id: "low", name: "Низький" },
  { id: "medium", name: "Середній" },
  { id: "high", name: "Високий" },
  { id: "critical", name: "Критичний" },
];

function FilterRadioGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-1">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-l-4 ${
            value === opt.id
              ? "border-l-blue-500 bg-primary/5 text-foreground"
              : "border-l-transparent text-muted-foreground hover:border-l-stone-500 hover:text-foreground"
          }`}
        >
          <RadioGroupItem value={opt.id} id={`filter-${opt.id}`} className="w-3.5 h-3.5 accent-blue-500" />
          <span className="text-xs font-semibold cursor-pointer">
            {opt.name}
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}

const AdminComplaintsPage = () => {
  const location = useLocation();
  const { user: currentUser } = useUser();
  const [selectedStatus, setSelectedStatus] = useState(location.state?.selectedStatus || "all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [ticketStatus, setTicketStatus] = useState("all");
  const [ticketCategory, setTicketCategory] = useState("all");
  const [ticketPriority, setTicketPriority] = useState("all");

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [approvedForTickets, setApprovedForTickets] = useState<Complaint[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedForTicket, setSelectedForTicket] = useState<Complaint | null>(null);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [, setEmployees] = useState<Employee[]>([]);

  const loadComplaints = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchAllComplaints();
      setComplaints(data);
      setSelectedComplaint(prev => prev ? data.find(c => c.id === prev.id) || prev : prev);
    } catch (err) {
      console.warn('Failed to load complaints', err);
      setErr("Не вдалося завантажити скарги.");
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    fetchTickets().then(setTickets);
  };

  useEffect(() => {
    loadComplaints();
    loadTickets();
    
    const handleUpdate = () => {
      loadComplaints();
      loadTickets();
    };
    
    window.addEventListener("adminComplaintUpdated", handleUpdate);
    return () => window.removeEventListener("adminComplaintUpdated", handleUpdate);
  }, []);

  const [tab, setTab] = useState<"requests" | "tickets">("requests");

  useEffect(() => {
    if (tab === "tickets") {
      loadTickets();
      fetchApprovedComplaints("new").then(setApprovedForTickets);
      fetchEmployees().then(setEmployees);
    }
  }, [tab]);

  const handleChangeStatus = async (id: number, newStatus: string) => {
    try {
      await updateComplaintStatus(id, newStatus);
      loadComplaints();
      loadTickets();
    } catch (err) {
      console.warn('Failed to change complaint status', err);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await deleteProblem(id);
      setComplaints((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (err) {
      console.warn('Failed to remove complaint', err);
    }
  };

  const openTicketModal = (complaint: Complaint, ticket?: Ticket) => {
    setSelectedForTicket(complaint);
    setTicketToEdit(ticket || null);
    setIsTicketModalOpen(true);
  };

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((p) => {
        const statusOk = selectedStatus === "all" || p.status === selectedStatus;
        const categoryOk =
          selectedCategory === "all" || p.category === selectedCategory;
        const priorityOk =
          selectedPriority === "all" || p.priority === selectedPriority;
        const searchOk =
          searchQuery === "" ||
          (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const dateOk = !selectedDate || new Date(p.createdAt).toLocaleDateString('en-CA') === format(selectedDate, 'yyyy-MM-dd');
        return statusOk && categoryOk && priorityOk && searchOk && dateOk;
      }),
    [complaints, selectedStatus, selectedCategory, selectedPriority, searchQuery, selectedDate]
  );

  const filteredTickets = useMemo(
    () =>
      approvedForTickets.filter((p) => {
        const categoryOk =
          ticketCategory === "all" || p.category === ticketCategory;
        const priorityOk =
          ticketPriority === "all" || p.priority === ticketPriority;
        const searchOk =
          ticketSearchQuery === "" ||
          (p.title || "").toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(ticketSearchQuery.toLowerCase());
        const hasTicket = tickets.some((t) => t.complaint === p.id);
        let statusOk = true;
        if (ticketStatus === "created") statusOk = hasTicket;
        else if (ticketStatus === "not_created") statusOk = !hasTicket;
        return categoryOk && priorityOk && searchOk && statusOk;
      }),
    [approvedForTickets, tickets, ticketCategory, ticketPriority, ticketStatus, ticketSearchQuery]
  );

  return (
    <>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-[90vw] bg-transparent border-none shadow-none p-0 flex justify-center items-center" showCloseButton={false}>
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {previewImage && (
            <img
              src={previewImage}
              className="w-full h-auto max-h-[90vh] object-contain"
              alt="Full size"
            />
          )}
          <DialogClose className="absolute top-4 right-4 text-foreground hover:text-stone-300">
            <HugeiconsIcon icon={Cancel01Icon} className="size-6" strokeWidth={2} />
          </DialogClose>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex flex-col min-h-screen">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "requests" | "tickets")} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between pr-6">
            <TabsList className="bg-muted/50 p-1 rounded-xl border border-border h-auto inline-flex gap-1 ml-6 mt-4">
              <TabsTrigger value="requests" className="px-6 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200">
                Скарги
              </TabsTrigger>
              <TabsTrigger value="tickets" className="px-6 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200">
                Тікети
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9"
                onClick={() => setIsExportModalOpen(true)}
              >
                <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={2} />
                Експорт даних
              </Button>
              <NotificationBell onSelectComplaint={(c) => {
                setSelectedComplaint(c);
                setSheetOpen(true);
              }} />
            </div>
          </div>
          <Separator />

          <TabsContent value="requests" className="flex-1 p-5">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-border shadow-none bg-card">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <HugeiconsIcon icon={SearchIcon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" strokeWidth={2} />
                      <Input
                        placeholder="Пошук скарг..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Статус
                    </h4>
                    <FilterRadioGroup
                      options={[{ id: "all", name: "Всі" }, ...statusOptions]}
                      value={selectedStatus}
                      onChange={setSelectedStatus}
                    />

                    <Separator className="my-4" />

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
                      Категорії
                    </h4>
                    <FilterRadioGroup
                      options={categoryOptions}
                      value={selectedCategory}
                      onChange={setSelectedCategory}
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

              <div className="lg:col-span-3 space-y-4">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="md" />
                  </div>
                )}
                {!loading && err && (
                  <div className="border border-red-500/30 bg-red-500/10 text-red-400 p-4 text-xs font-bold">
                    {err}
                  </div>
                )}

                {!loading && !err && filteredComplaints.length === 0 && (
                  <div className="border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                      <HugeiconsIcon icon={InboxIcon} className="size-5" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">Скарг не знайдено</p>
                    <p className="text-xs text-muted-foreground">Жодна скарга не відповідає поточним фільтрам.</p>
                  </div>
                )}

                {!loading &&
                  !err &&
                  filteredComplaints.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredComplaints.map((p) => (
                        <Card
                          key={p.id}
                          className={`border-border shadow-none bg-card group hover:bg-muted/50 transition-colors cursor-pointer flex flex-col justify-between border-l-4 ${
                            p.priority === "critical" ? "border-l-red-600" :
                            p.priority === "high" ? "border-l-orange-500" :
                            p.priority === "medium" ? "border-l-yellow-500" : "border-l-green-500"
                          }`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button, [role="dialog"], a')) return;
                            setSelectedComplaint(p);
                            setSheetOpen(true);
                          }}
                        >
                          <div className="p-5 flex flex-col h-full justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-sm font-bold text-foreground truncate" title={p.title}>
                                    {p.title || "Без назви"}
                                  </h3>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                    {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category || "Категорія"}
                                    <span className="w-1 h-1 bg-border inline-block mx-1.5 align-middle" />
                                    {p.building ? `Корпус ${p.building}` : "Корпус ?"}
                                    <span className="w-1 h-1 bg-border inline-block mx-1.5 align-middle" />
                                    {p.placeName || "?"}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 ${statusBadgeClass(p.status)}`}>
                                  {statusLabel(p.status)}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${priorityBadgeClass(p.priority)}`}
                                >
                                  {priorityLabel(p.priority)}
                                </Badge>
                                {p.createdAt && (
                                  <span className="text-[11px] text-muted-foreground font-semibold">
                                    {new Date(p.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2 break-all whitespace-pre-wrap">
                                {p.description || "—"}
                              </p>

                              {p.photoUrl && (
                                <div 
                                  className="w-full h-32 overflow-hidden border border-border mb-4 cursor-zoom-in rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(resolveImageUrl(p.photoUrl as string));
                                  }}
                                >
                                  <img
                                    src={resolveImageUrl(p.thumbnail || p.photoUrl)}
                                    alt=""
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="pt-3 border-t border-border/50 flex flex-col gap-2 mt-auto">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                                  ID: {p.id}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedComplaint(p);
                                    setSheetOpen(true);
                                  }}
                                  className="text-muted-foreground h-7 text-xs px-2"
                                >
                                  <HugeiconsIcon icon={MoreHorizontalIcon} className="size-3.5 mr-1 text-muted-foreground" />
                                  Деталі
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {p.status === "pending" && (
                                  <>
                                    <Button size="sm" className="h-8 text-[11px] flex-1" onClick={() => openTicketModal(p)}>
                                      <HugeiconsIcon icon={Ticket01Icon} className="size-3 mr-1" strokeWidth={2} />
                                      Призначити
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="h-8 text-[11px] flex-1"
                                        >
                                          <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                                          Відхилити
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Відхилити скаргу?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Ви впевнені, що хочете відхилити цю скаргу? Вона перейде в статус "Відхилено".
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleChangeStatus(p.id, "rejected")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Відхилити</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                                {p.status === "approved" && tickets.some(t => t.complaint === p.id) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" className="h-8 text-[11px] w-full">
                                        <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                                        Позначити як виконане
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Позначити як виконану?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Ви впевнені, що проблема була успішно виконана? Скарга перейде в статус "Вирішено".
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleChangeStatus(p.id, "resolved")}>Позначити як виконане</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {p.status !== "resolved" && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className={`h-8 text-[11px] ${p.status === "pending" ? "w-full" : "flex-1"}`}
                                      >
                                        <HugeiconsIcon icon={Delete01Icon} className="size-3 mr-1" strokeWidth={2} />
                                        Видалити
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Видалити скаргу?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Ви впевнені, що хочете видалити цю скаргу? Цю дію неможливо скасувати.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemove(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Видалити</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="flex-1 p-5">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-border shadow-none bg-card">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <HugeiconsIcon icon={SearchIcon} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" strokeWidth={2} />
                      <Input
                        placeholder="Пошук тікетів..."
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Статус тікету
                    </h4>
                    <FilterRadioGroup
                      options={ticketStatusOptions}
                      value={ticketStatus}
                      onChange={setTicketStatus}
                    />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Пріоритет
                    </h4>
                    <FilterRadioGroup
                      options={priorityOptions}
                      value={ticketPriority}
                      onChange={setTicketPriority}
                    />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Категорії
                    </h4>
                    <FilterRadioGroup
                      options={categoryOptions}
                      value={ticketCategory}
                      onChange={setTicketCategory}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <h3 className="text-sm font-bold text-foreground">
                  Тікети для підтверджених заявок
                </h3>
                {filteredTickets.length === 0 ? (
                  <div className="border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                      <HugeiconsIcon icon={InboxIcon} className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-muted-foreground">Жодна заявка не відповідає фільтрам.</p>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-4">
                    {filteredTickets.map((p) => {
                      const ticket = tickets.find((t) => t.complaint === p.id);
                      return (
                        <Card key={p.id} className="border-border shadow-none bg-card">
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-sm font-bold text-foreground">
                                {p.title || "Без назви"}
                              </h4>
                              <Badge
                                variant="outline"
                                className={priorityBadgeClass(p.priority)}
                              >
                                {priorityLabel(p.priority)}
                              </Badge>
                            </div>
                            <div className="flex gap-2 mb-3 items-center">
                              <Badge variant="outline" className="text-muted-foreground border-border bg-card">
                                {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category || "Категорія"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{p.building ? `Корпус ${p.building}` : "Корпус ?"}<span className="w-1 h-1 bg-border inline-block mx-1" />{p.placeName || "?"}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-3 break-all whitespace-pre-wrap">{p.description}</p>

                             {ticket ? (
                              <div className="bg-primary/5 p-3 border border-primary/10 relative group/ticket">
                                {ticket.user && (
                                  <p className="text-xs text-primary/80 mt-1">
                                    Виконавець: {ticket.user.first_name} {ticket.user.last_name}
                                  </p>
                                )}
                                {ticket.deadline && (
                                  <p className="text-xs text-primary/70 mt-1">
                                    Дедлайн: {new Date(ticket.deadline).toLocaleDateString()}
                                  </p>
                                )}
                                {p.status !== "resolved" && (
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => openTicketModal(p, ticket)}
                                    className="absolute top-2 right-2 text-primary hover:text-blue-300 opacity-0 group-hover/ticket:opacity-100 transition-opacity"
                                  >
                                    <HugeiconsIcon icon={EditIcon} className="size-3.5" strokeWidth={2} />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              p.status !== "resolved" && (
                                <Button
                                  onClick={() => openTicketModal(p)}
                                >
                                  <HugeiconsIcon icon={AddIcon} className="size-4 mr-1.5" strokeWidth={2} />
                                  Створити тікет
                                </Button>
                              )
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedComplaint && (
        <ComplaintSidePanel
          complaint={selectedComplaint}
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setSelectedComplaint(null);
          }}
          onStatusChange={() => {
            loadComplaints();
            loadTickets();
          }}
          currentUserId={currentUser?.user}
          isAdmin={true}
          ticket={tickets.find(t => t.complaint === selectedComplaint?.id)}
        />
      )}

      {isTicketModalOpen && selectedForTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-base font-bold text-foreground">
                {ticketToEdit ? "Редагувати тікет" : "Створити тікет"}
              </h2>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsTicketModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-5" strokeWidth={2} />
              </Button>
            </div>
            <TicketCreateForm
              fixedComplaintId={selectedForTicket.id as number}
              onClose={() => setIsTicketModalOpen(false)}
              onSaved={() => {
                setIsTicketModalOpen(false);
                loadTickets();
                loadComplaints();
                window.dispatchEvent(new Event("adminComplaintUpdated"));
              }}
              editTicket={ticketToEdit}
            />
          </div>
        </div>
      )}

      <ExportTicketsModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
    </>
  );
};

export default AdminComplaintsPage;
