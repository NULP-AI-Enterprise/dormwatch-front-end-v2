import React, { useState, useEffect } from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent } from "./ui/sheet";
import CommentSection from "./CommentSection";
import TicketCreateForm from "./TicketCreateForm";
import ProgressStepper from "./ProgressStepper";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
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
} from "./ui/alert-dialog";
import { resolveImageUrl } from "../services/imageUtils";
import { CATEGORY_LABELS, updateComplaintStatus, deleteProblem, updateComplaintPriority } from "../services/problemsApi";
import { statusBadgeClass, statusLabel, priorityBadgeClass, priorityLabel, getDeadlineStatus } from "../lib/complaintUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Ticket01Icon, CheckmarkCircleIcon, CancelCircleIcon, Cancel01Icon, UserIcon } from "@hugeicons/core-free-icons";
import type { Complaint, Ticket } from "../lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";

interface ComplaintSidePanelProps {
  complaint: Complaint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: () => void;
  currentUserId?: number | string;
  isAdmin: boolean;
  isWorker?: boolean;
  ticket?: Ticket | null;
}

const ComplaintSidePanel = ({
  complaint,
  open,
  onOpenChange,
  onStatusChange,
  currentUserId,
  isAdmin,
  isWorker = false,
  ticket = null,
}: ComplaintSidePanelProps) => {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const isPrioritySelectOpen = React.useRef(false);

  const [localPriority, setLocalPriority] = useState(complaint?.priority || "medium");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [photoAfterFile, setPhotoAfterFile] = useState<File | null>(null);
  const [photoAfterPreview, setPhotoAfterPreview] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (complaint?.priority) {
      setLocalPriority(complaint.priority);
    }
  }, [complaint?.priority]);

  if (!complaint) return null;

  const handleStatusChange = async (newStatus: string, photoFile: File | null = null, reason: string = "") => {
    try {
      await updateComplaintStatus(complaint.id, newStatus, photoFile as any, reason);
      onStatusChange();
      onOpenChange(false);
    } catch (err) {
      console.warn('Failed to change complaint status', err);
    }
  };

  const handlePhotoAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoAfterFile(file);
      setPhotoAfterPreview(URL.createObjectURL(file));
    }
  };

  const handleResolveSubmit = async () => {
    setResolving(true);
    try {
      await handleStatusChange("resolved", photoAfterFile);
      setResolveDialogOpen(false);
      setPhotoAfterFile(null);
      setPhotoAfterPreview(null);
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setLocalPriority(newPriority);
    try {
      await updateComplaintPriority(complaint.id, newPriority);
      onStatusChange();
    } catch (err) {
      console.warn('Failed to change complaint priority', err);
      setLocalPriority(complaint.priority);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProblem(complaint.id);
      onStatusChange();
      onOpenChange(false);
    } catch (err) {
      console.warn('Failed to delete complaint', err);
    }
  };

  const categoryLabel =
    CATEGORY_LABELS[complaint.category as keyof typeof CATEGORY_LABELS] || complaint.category;

  return (
    <>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className={`${isAdmin ? "max-w-[90vw] sm:max-w-[90vw]" : "max-w-4xl sm:max-w-4xl"} bg-transparent border-none shadow-none p-0 flex justify-center items-center`} showCloseButton={false}>
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

    <Sheet 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && isPrioritySelectOpen.current) return;
        onOpenChange(newOpen);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Деталі скарги</SheetTitle>
          <SheetDescription>Інформація про скаргу та керування статусом</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className={statusBadgeClass(complaint.status)}>
                {statusLabel(complaint.status)}
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground">
                {String(complaint.id) !== "new" && `#${complaint.id}`}
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">{complaint.title || "Без назви"}</h3>
            <p className="text-xs font-normal text-muted-foreground">{complaint.building ? `Корпус ${complaint.building}` : "Корпус ?"}<span className="w-1 h-1 bg-border inline-block mx-1.5" />{complaint.placeName || "?"}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              {categoryLabel}
            </span>
            <span className="w-1 h-1 bg-border" />
            {isAdmin && complaint.status !== "resolved" ? (
              <Select 
                value={localPriority} 
                onValueChange={handlePriorityChange}
                onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    setTimeout(() => { isPrioritySelectOpen.current = false; }, 150);
                  } else {
                    isPrioritySelectOpen.current = true;
                  }
                }}
              >
                <SelectTrigger className={`h-6 text-xs px-2 py-0 font-semibold border ${priorityBadgeClass(localPriority)}`}>
                  <SelectValue placeholder="Пріоритет" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низький</SelectItem>
                  <SelectItem value="medium">Середній</SelectItem>
                  <SelectItem value="high">Високий</SelectItem>
                  <SelectItem value="critical">Критичний</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant="outline"
                className={priorityBadgeClass(localPriority)}
              >
                  Пріоритет: {priorityLabel(localPriority)}
              </Badge>
            )}
            {complaint.createdAt && (
              <span className="text-xs text-muted-foreground font-semibold">
                {new Date(complaint.createdAt).toLocaleDateString()}
              </span>
            )}
            {complaint.deadline && (
              (() => {
                const dl = getDeadlineStatus(complaint.deadline, complaint.status === "resolved");
                // Remove the raw red-400 classes and use dl.className
                // dl.className contains the border and bg classes, but in details sheet we can just style the text color cleanly
                // e.g. text-red-400 or text-amber-500 or text-blue-500. We can match text color from the class using regex or template classes.
                let textColorClass = "text-blue-500";
                if (complaint.status === "resolved") textColorClass = "text-muted-foreground";
                else if (dl.className.includes("text-red-500")) textColorClass = "text-red-400";
                else if (dl.className.includes("text-amber-500")) textColorClass = "text-amber-500";
                
                return (
                  <>
                    <span className="w-1 h-1 bg-border rounded-full" />
                    <span className={`text-xs ${textColorClass} font-bold`}>
                      {dl.label}: {new Date(complaint.deadline).toLocaleString("uk-UA", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                );
              })()
            )}
          </div>

          <div className="my-4">
            <ProgressStepper stage={
              complaint.status === "resolved" ? "resolved" :
              (complaint.status === "approved" || complaint.status === "published") ? "in_progress" :
              "submitted"
            } />
          </div>

          {(complaint.assignedWorker || ticket?.user) && (complaint.status === "approved" || complaint.status === "resolved") && (
            (() => {
              const workerObj = complaint.assignedWorker || ticket?.user;
              return (
                <div className="flex items-center gap-3 py-2 px-3 bg-muted border border-border">
                  <div className="w-7 h-7 bg-card border border-border flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={UserIcon} className="size-3.5 text-primary" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-normal text-muted-foreground">Призначений працівник</p>
                    <p className="text-xs font-bold text-foreground truncate">
                      {workerObj?.first_name} {workerObj?.last_name}
                    </p>
                  </div>
                </div>
              );
            })()
          )}

          {complaint.creator && (isAdmin || isWorker) && (
            <div className="flex items-center gap-3 py-2 px-3 bg-muted/50 border border-border rounded-sm">
              <div className="w-7 h-7 bg-card border border-border flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={UserIcon} className="size-3.5 text-primary" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-normal text-muted-foreground">
                  Автор скарги: {complaint.creator.first_name} {complaint.creator.last_name}
                </p>
                <p className="text-xs font-bold text-foreground truncate">
                  {complaint.creator.contact_info || "Контакти не вказані"}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed break-all whitespace-pre-wrap">{complaint.description || "—"}</p>

          {(complaint.photoUrl || complaint.photoAfter) && (
            <div className={`grid gap-3 mt-2 ${complaint.photoUrl && complaint.photoAfter ? "grid-cols-2" : "grid-cols-1"}`}>
              {complaint.photoUrl && (
                <div className="flex flex-col gap-1">
                  {complaint.photoAfter && <span className="text-[10px] font-semibold text-muted-foreground">Фото проблеми (До):</span>}
                  <div 
                    className="w-full h-36 overflow-hidden border border-border cursor-zoom-in rounded bg-muted/20"
                    onClick={() => setPreviewImage(resolveImageUrl(complaint.photoUrl as string))}
                  >
                    <img
                      src={resolveImageUrl(complaint.thumbnail || complaint.photoUrl)}
                      alt="До"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              )}
              {complaint.photoAfter && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-green-500">Результат виконано (Після):</span>
                  <div 
                    className="w-full h-36 overflow-hidden border border-green-500/20 cursor-zoom-in rounded bg-muted/20"
                    onClick={() => setPreviewImage(resolveImageUrl(complaint.photoAfter as string))}
                  >
                    <img
                      src={resolveImageUrl(complaint.photoAfter)}
                      alt="Після"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {(isAdmin || isWorker) && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {isAdmin && complaint.status === "pending" && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button>
                          <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                          Схвалити
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Схвалити скаргу?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ви впевнені, що хочете схвалити цю скаргу? Вона перейде в статус "Активно".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleStatusChange("approved")}>Схвалити</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                        >
                          <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                          Відхилити
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Відхилити скаргу?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Будь ласка, вкажіть причину відхилення скарги. Студент отримає сповіщення про це.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-2">
                          <Textarea
                            placeholder="Введіть причину відхилення..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                            className="text-xs bg-card"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setRejectionReason("")}>Скасувати</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              handleStatusChange("rejected", null, rejectionReason);
                              setRejectionReason("");
                            }} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={!rejectionReason.trim()}
                          >
                            Відхилити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                
                {((isAdmin && complaint.status === "approved" && ticket) || (isWorker && (complaint.status === "approved" || complaint.status === "pending"))) && (
                  <Button
                    onClick={() => setResolveDialogOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs"
                  >
                    <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                    Позначити як виконане
                  </Button>
                )}

                {isWorker && complaint.status === "resolved" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10">
                        <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                        Повернути в роботу
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Повернути скаргу в роботу?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Статус скарги зміниться на "Активно".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleStatusChange("approved")}>Активувати</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {isAdmin && (
                  <>
                    {!showTicketForm && complaint.status === "approved" && !ticket && (
                      <Button
                        variant="outline"
                        onClick={() => setShowTicketForm(true)}
                      >
                        <HugeiconsIcon icon={Ticket01Icon} className="size-3 mr-1" strokeWidth={2} />
                        Створити тікет
                      </Button>
                    )}
                    {complaint.status !== "resolved" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
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
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Видалити</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </>
                )}
              </div>

              {isAdmin && showTicketForm && complaint.status !== "resolved" && (
                <TicketCreateForm
                  fixedComplaintId={complaint.id as number}
                  onClose={() => setShowTicketForm(false)}
                  onSaved={() => {
                    setShowTicketForm(false);
                    onOpenChange(false);
                    onStatusChange();
                  }}
                />
              )}
            </div>
          )}

          <Separator dashed />

          <CommentSection complaintId={complaint.id} currentUserId={currentUserId} isAdmin={isAdmin} isWorker={isWorker} complaintAuthorId={complaint.user_id} />
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <SheetHeader className="text-left mb-4">
          <DialogTitle className="text-sm font-bold text-foreground">Позначити роботу як виконану</DialogTitle>
          <SheetDescription className="text-xs text-muted-foreground mt-1">
            Ви підтверджуєте завершення ремонту. Опціонально ви можете завантажити фото виконаної роботи («Після»), щоб студент і адміністратор бачили результат.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">
              Фото виконаної роботи (опціонально)
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoAfterChange}
                className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
              />
              {photoAfterPreview && (
                <div className="w-full h-32 overflow-hidden border border-border rounded relative bg-muted/20">
                  <img
                    src={photoAfterPreview}
                    alt="Прев'ю результату"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoAfterFile(null);
                      setPhotoAfterPreview(null);
                    }}
                    className="absolute top-1 right-1 bg-background/80 hover:bg-background border border-border p-1 rounded-full text-red-500 shadow-sm transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false);
                setPhotoAfterFile(null);
                setPhotoAfterPreview(null);
              }}
              disabled={resolving}
              className="text-xs h-9 font-semibold"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleResolveSubmit}
              disabled={resolving}
              className="bg-green-600 hover:bg-green-700 text-white text-xs h-9 font-semibold"
            >
              {resolving ? "Збереження..." : "Підтвердити виконання"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ComplaintSidePanel;
