import { useEffect, useState } from "react";
import {
  fetchAllComplaints,
  fetchTickets,
  CATEGORY_LABELS,
} from "../services/problemsApi";
import ComplaintSidePanel from "../components/ComplaintSidePanel";
import { ExportTicketsModal } from "../components/ExportTicketsModal";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  DashboardSquare01Icon,
  TaskDone01Icon,
} from "@hugeicons/core-free-icons";
import { statusBadgeClass, statusLabel } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
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

  const init = async () => {
    try {
      const [complaintsData, ticketsData] = await Promise.all([
        fetchAllComplaints(),
        fetchTickets(),
      ]);
      setComplaints(complaintsData);
      setTickets(ticketsData);
    } catch (e) {
      console.warn("Failed to load admin dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
    window.addEventListener("adminComplaintUpdated", init);
    
    const handleOpenComplaint = (e: any) => {
      setSelectedComplaint(e.detail);
      setSheetOpen(true);
    };
    const handleExport = () => setIsExportModalOpen(true);
    const handleAssign = () => setIsTicketModalOpen(true);

    window.addEventListener("openComplaint", handleOpenComplaint);
    window.addEventListener("triggerExport", handleExport);
    window.addEventListener("triggerAssignWorker", handleAssign);

    return () => {
      window.removeEventListener("adminComplaintUpdated", init);
      window.removeEventListener("openComplaint", handleOpenComplaint);
      window.removeEventListener("triggerExport", handleExport);
      window.removeEventListener("triggerAssignWorker", handleAssign);
    };
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

          <div className="bg-card border border-border overflow-hidden">
            <div className="px-6 py-4">
              <h2 className="text-xl font-semibold text-foreground">Останні скарги</h2>
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
                      <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-40" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-20" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : recentComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                      Скарги відсутні
                    </TableCell>
                  </TableRow>
                ) : (
                  recentComplaints.map((c) => {
                    const priorityColor =
                      c.priority === "critical" ? "border-l-red-500"
                      : c.priority === "high" ? "border-l-orange-500"
                      : c.priority === "medium" ? "border-l-yellow-500"
                      : c.priority === "low" ? "border-l-green-500"
                      : "border-l-slate-600";
                    return (
                      <TableRow
                        key={c.id}
                        className={`hover:bg-muted/30 cursor-pointer transition-colors border-l-4 ${priorityColor}`}
                        onClick={() => handleRowClick(c)}
                      >
                        <TableCell className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{c.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          {CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("uk-UA")}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant="outline" className={statusBadgeClass(c.status)}>
                            {statusLabel(c.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <ComplaintSidePanel
        complaint={selectedComplaint}
        open={sheetOpen}
        onOpenChange={(open) => setSheetOpen(open)}
        onStatusChange={handleRefresh}
        currentUserId={currentUser?.user}
        isAdmin={true}
        ticket={tickets.find(t => t.complaint === selectedComplaint?.id)}
      />

      <ExportTicketsModal open={isExportModalOpen} onOpenChange={setIsExportModalOpen} />

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
