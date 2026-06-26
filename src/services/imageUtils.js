const API_BASE = import.meta.env.VITE_API_URL || "/api";

export function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${API_BASE}${path}`;
}
