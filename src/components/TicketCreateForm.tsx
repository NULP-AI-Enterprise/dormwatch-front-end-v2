import { useState, useEffect } from "react";
import { Button } from "./ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, AddIcon, SaveIcon } from "@hugeicons/core-free-icons";
import { fetchEmployees, createTicket, updateTicket, fetchAllComplaints, fetchTickets, updateComplaintStatus } from "../services/problemsApi";
import type { Complaint, Employee, Ticket } from "../lib/types";
import { DatePicker } from "./ui/date-picker";
import { format } from "date-fns";

interface TicketCreateFormProps {
  onClose: () => void;
  onSaved: () => void;
  editTicket?: Ticket | null;
  fixedComplaintId?: number;
}

const TicketCreateForm = ({ onClose, onSaved, editTicket, fixedComplaintId }: TicketCreateFormProps) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState(
    fixedComplaintId ? String(fixedComplaintId) : (editTicket?.complaint ? String(editTicket.complaint) : "")
  );
  const [selectedEmployee, setSelectedEmployee] = useState(
    editTicket?.user?.user ? String(editTicket.user.user) : ""
  );
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    editTicket?.deadline ? new Date(editTicket.deadline) : undefined
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allComplaints, allTickets, allEmployees] = await Promise.all([
          fetchAllComplaints(),
          fetchTickets(),
          fetchEmployees()
        ]);

        const unassigned = allComplaints.filter(c => {
          if (editTicket && String(c.id) === String(editTicket.complaint)) {
            return true;
          }
          if (fixedComplaintId && String(c.id) === String(fixedComplaintId)) {
            return true;
          }
          const isActiveOrPending = c.status === "pending" || c.status === "approved";
          const isUnassigned = !allTickets.some(t => String(t.complaint) === String(c.id));
          return isActiveOrPending && isUnassigned;
        });

        setComplaints(unassigned);
        setEmployees(allEmployees);
      } catch (err) {
        console.warn("Failed to load TicketCreateForm data", err);
      }
    };
    loadData();
  }, [editTicket, fixedComplaintId]);

  const handleSave = async () => {
    const complaintIdToUse = fixedComplaintId || Number(selectedComplaint);
    if (!complaintIdToUse) return;
    setSaving(true);
    try {
      const deadlineStr = deadlineDate ? format(deadlineDate, "yyyy-MM-dd") : null;
      if (editTicket) {
        await updateTicket(
          editTicket.ticket_id,
          selectedEmployee || null,
          deadlineStr
        );
      } else {
        await createTicket(
          complaintIdToUse,
          selectedEmployee || null,
          deadlineStr
        );
        // Automatically approve the complaint if it was pending
        const target = complaints.find(c => String(c.id) === String(complaintIdToUse));
        if (target && target.status === "pending") {
          try {
            await updateComplaintStatus(target.id, "approved");
          } catch (statusErr) {
            console.error("Failed to auto-approve complaint:", statusErr);
          }
        }
      }
      onSaved();
    } catch (err) {
      console.error("Failed to save ticket:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block">
          Скарга
        </label>
        {fixedComplaintId ? (
          <div className="w-full h-10 px-3 py-2 border border-border bg-muted/50 rounded-md text-xs font-semibold text-foreground flex items-center">
            {complaints.find(c => String(c.id) === String(fixedComplaintId))?.title || "Завантаження..."}
          </div>
        ) : (
          <Select value={selectedComplaint} onValueChange={setSelectedComplaint} disabled={!!editTicket}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Виберіть скаргу..." />
            </SelectTrigger>
            <SelectContent>
              {complaints.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.title || `Скарга #${c.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block">
          Призначити працівника
        </label>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="-- Не призначено --" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.user} value={String(emp.user)}>
                {emp.first_name} {emp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block">
          Дедлайн
        </label>
        <DatePicker
          date={deadlineDate}
          setDate={setDeadlineDate}
          placeholder="Оберіть дедлайн"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} className="size-4 mr-1.5" strokeWidth={2} />
          Скасувати
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !selectedComplaint}
        >
          {editTicket ? <HugeiconsIcon icon={SaveIcon} className="size-4 mr-1.5" strokeWidth={2} /> : <HugeiconsIcon icon={AddIcon} className="size-4 mr-1.5" strokeWidth={2} />}
          {saving ? "Збереження..." : editTicket ? "Оновити тікет" : "Створити тікет"}
        </Button>
      </div>
    </div>
  );
};

export default TicketCreateForm;
