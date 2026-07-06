export const statusBadgeClass = (status: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "text-red-500 bg-red-500/10 border-red-700/50";
  if (s === "rejected") return "text-purple-500 bg-purple-500/10 border-purple-700/50";
  if (s === "resolved") return "text-green-500 bg-green-500/10 border-green-700/50";
  if (s === "approved") return "text-yellow-500 bg-yellow-500/10 border-yellow-700/50";
  return "text-muted-foreground bg-card border-border";
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Очікує",
  approved: "Активно",
  rejected: "Відхилено",
  resolved: "Вирішено",
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: "Високий",
  medium: "Середній",
  low: "Низький",
  critical: "Критично",
};

export const statusLabel = (status: string) => {
  const s = String(status || "").toLowerCase();
  return STATUS_LABELS[s] || status;
};

export const priorityBadgeClass = (priority: string) => {
  const p = String(priority || "").toLowerCase();
  if (p === "critical") return "text-red-500 bg-red-500/10 border-red-700/80 animate-pulse font-bold";
  if (p === "high") return "text-orange-500 bg-orange-500/10 border-orange-700/50";
  if (p === "low") return "text-green-500 bg-green-500/10 border-green-700/50";
  return "text-yellow-500 bg-yellow-500/10 border-yellow-700/50";
};

export const priorityLabel = (priority: string) => {
  const p = String(priority || "").toLowerCase();
  return PRIORITY_LABELS[p] || priority;
};

export const isAdminUser = (user: any) =>
  !!(
    user?.role &&
    ["admin", "адміністратор"].includes(
      (user.role.role_name || "").toLowerCase()
    )
  );

export const isWorkerUser = (user: any) =>
  !!(
    user?.role &&
    ["worker", "робітник", "майстер"].includes(
      (user.role.role_name || "").toLowerCase()
    )
  );

export const getUserInitials = (user: any, fallback = "U") => {
  if (!user) return fallback;
  const initials = `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase();
  return initials || fallback;
};

export const getDeadlineStatus = (deadlineStr: string | null | undefined, isResolved = false) => {
  if (!deadlineStr) return { className: "text-muted-foreground bg-muted/30 border-border", label: "Без дедлайну" };
  if (isResolved) return { className: "text-muted-foreground bg-muted/30 border-border", label: "Дедлайн" };

  const deadline = new Date(deadlineStr);
  const now = new Date();
  
  const diffTime = deadline.getTime() - now.getTime();
  
  if (diffTime < 0) {
    return {
      className: "text-red-500 bg-red-500/10 border-red-700/50 font-bold",
      label: "Прострочено"
    };
  }

  const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === deadline.toDateString();
  const within24h = diffTime <= 24 * 60 * 60 * 1000;

  if (isTomorrow || within24h) {
    return {
      className: "text-amber-500 bg-amber-500/10 border-amber-700/50 font-bold",
      label: "Дедлайн завтра"
    };
  }

  return {
    className: "text-blue-500 bg-blue-500/10 border-blue-700/50",
    label: "Дедлайн"
  };
};
