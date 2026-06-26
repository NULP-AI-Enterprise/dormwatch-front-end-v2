import { useState } from "react";
import { Sheet, SheetHeader, SheetTitle, SheetClose, SheetContent } from "./ui/sheet";
import CommentSection from "./CommentSection";
import TicketCreateForm from "./TicketCreateForm";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { resolveImageUrl } from "../services/imageUtils";
import { CATEGORY_LABELS, updateComplaintStatus, deleteProblem } from "../services/problemsApi";
import { statusBadgeClass, statusLabel, humanLocation } from "../lib/complaintUtils";
import { Trash2, Ticket } from "lucide-react";

const ComplaintSidePanel = ({
  complaint,
  open,
  onOpenChange,
  onStatusChange,
  currentUserId,
  isAdmin,
}: ComplaintSidePanelProps) => {
  const [showTicketForm, setShowTicketForm] = useState(false);

  if (!complaint) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateComplaintStatus(complaint.id, newStatus);
      onStatusChange();
    } catch {
      // silently fail
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProblem(complaint.id);
      onStatusChange();
      onOpenChange(false);
    } catch {
      // silently fail
    }
  };

  const categoryLabel =
    CATEGORY_LABELS[complaint.category as keyof typeof CATEGORY_LABELS] || complaint.category;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>Деталі заявки</SheetTitle>
        <SheetClose />
      </SheetHeader>
      <SheetContent>
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className={statusBadgeClass(complaint.status)}>
                {statusLabel(complaint.status)}
              </Badge>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-stone-500">
                #{complaint.id}
              </span>
            </div>
            <h3 className="text-base font-bold text-stone-50 mb-1">{complaint.title}</h3>
            <p className="micro-label">{humanLocation(complaint)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-stone-400 border-stone-700 bg-stone-800">
              {categoryLabel}
            </Badge>
            <Badge
              variant="outline"
              className={`badge-status ${
                complaint.priority === "high"
                  ? "badge-urgent"
                  : complaint.priority === "low"
                  ? "badge-resolved"
                  : "badge-pending"
              }`}
            >
                Пріоритет: {complaint.priority === "high" ? "Високий" : complaint.priority === "low" ? "Низький" : "Середній"}
            </Badge>
            {complaint.createdAt && (
              <Badge variant="outline" className="text-stone-400 border-stone-700 bg-stone-800">
                {new Date(complaint.createdAt).toLocaleDateString()}
              </Badge>
            )}
          </div>

          <hr className="border-t border-dashed border-stone-700" />

          <p className="text-xs text-stone-400 leading-relaxed">{complaint.description || "—"}</p>

          {complaint.photoUrl && (
            <div className="w-full h-44 overflow-hidden border border-stone-700">
              <img
                src={resolveImageUrl(complaint.thumbnail || complaint.photoUrl)}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <hr className="border-t border-dashed border-stone-700" />

          {isAdmin && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {complaint.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange("approved")}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      Схвалити
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange("rejected")}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      Відхилити
                    </Button>
                  </>
                )}
                {complaint.status === "approved" && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange("resolved")}
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    Позначити вирішеним
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  <Trash2 className="w-3 h-3 mr-1" strokeWidth={2} />
                  Видалити
                </Button>
              </div>

              <hr className="border-t border-dashed border-stone-700" />

              {!showTicketForm ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-[10px] font-bold uppercase tracking-wider"
                  onClick={() => setShowTicketForm(true)}
                >
                  <Ticket className="w-3 h-3 mr-1" strokeWidth={2} />
                  Створити замовлення
                </Button>
              ) : (
                <TicketCreateForm
                  onClose={() => setShowTicketForm(false)}
                  onSaved={() => {
                    setShowTicketForm(false);
                    onOpenChange(false);
                  }}
                />
              )}
            </div>
          )}

          <hr className="border-t border-dashed border-stone-700" />

          <CommentSection complaintId={complaint.id} currentUserId={currentUserId} isAdmin={isAdmin} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ComplaintSidePanel;
