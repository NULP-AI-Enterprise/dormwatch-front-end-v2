export const statusBadgeClass = (status: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "badge-pending";
  if (s === "rejected") return "badge-urgent";
  if (s === "resolved") return "badge-resolved";
  if (s === "approved") return "badge-progress";
  return "badge-status text-stone-400 bg-stone-800 border-stone-700";
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Очікує",
  approved: "Активно",
  rejected: "Відхилено",
  resolved: "Вирішено",
};

export const statusLabel = (status: string) => {
  const s = String(status || "").toLowerCase();
  return STATUS_LABELS[s] || status;
};

export const humanLocation = (p: any) => {
  const b = p.building ? `Корпус ${p.building}` : "Корпус ?";
  const place = p.placeName ? ` \u2022 ${p.placeName}` : " \u2022 ?";
  return `${b}${place}`;
};
