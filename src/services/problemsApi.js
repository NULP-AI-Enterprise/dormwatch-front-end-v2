const API_BASE = "http://127.0.0.1:8000/api";
const USE_BACKEND = true;
const LS_AUTH_KEY = "basic_auth_header";

// --- AUTH ---
export async function loginUser(username, password) {
  const credentials = btoa(`${username}:${password}`);
  const authHeader = `Basic ${credentials}`;
  
  try {
      const res = await fetch(`${API_BASE}/profile/`, { headers: { "Authorization": authHeader } });
      if (res.ok) {
        localStorage.setItem(LS_AUTH_KEY, authHeader);
        return await res.json();
      }
      throw new Error("Невірний логін або пароль");
  } catch (e) {
      console.error("Login failed:", e);
      throw e;
  }
}

export function logoutUser() {
  localStorage.removeItem(LS_AUTH_KEY);
  window.location.reload();
}

// --- CORE FETCH ---
async function fetchJson(path, { method = "GET", body } = {}) {
  const authHeader = localStorage.getItem(LS_AUTH_KEY);
  const headers = { ...(authHeader ? { "Authorization": authHeader } : {}) };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: (body instanceof FormData) ? body : (body ? JSON.stringify(body) : undefined),
  });

  if (res.status === 401) {
    localStorage.removeItem(LS_AUTH_KEY);
    throw new Error("AUTH_REQUIRED");
  }

  if (!res.ok) {
     const errText = await res.text();
     throw new Error(errText || `Error ${res.status}`);
  }

  if (res.status === 204) return true;

  return await res.json();
}

export const CATEGORY_LABELS = {
  plumbing: "Сантехніка", electricity: "Електрика", furniture: "Меблі", internet: "Інтернет",
};

// --- NORMALIZER ---
function normalizeComplaint(raw) {
  if (!raw) return null;
  const nowIso = new Date().toISOString();
  let status = raw.status || "pending";
  if (status === 'published') status = 'approved';
  if (status === 'denied') status = 'rejected';

  let safePlaceName = "";
  let safeBuilding = "4";

  if (raw.place) {
      safePlaceName = raw.place.place_name || "";
      if (raw.place.building) {
          safeBuilding = raw.place.building.name || "4";
      }
  }

  return {
    id: raw.id ?? raw.complaint_id ?? Date.now(),
    title: raw.title ?? "Без назви",
    description: raw.description ?? "",
    category: raw.category?.name ?? raw.category ?? "plumbing",
    building: safeBuilding,
    placeName: safePlaceName,
    photoUrl: raw.photo_url ?? raw.photoUrl ?? null, 
    status: status, 
    votesCount: Number(raw.votesCount || raw.counter || 0),
    createdAt: raw.created_at || raw.createdAt || nowIso,
    user_id: raw.user?.id || raw.user?.user || raw.user || null,
  };
}

function sortByNew(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

// ======================================================================
// API FUNCTIONS
// ======================================================================

export async function fetchUserProfile() {
  try {
      const data = await fetchJson(`/profile/?t=${Date.now()}`);
      if (data) {
          data.is_admin = data.role && ['admin', 'адміністратор'].includes(String(data.role.role_name).toLowerCase());
      }
      return data;
  } catch (e) {
      return null;
  }
}

export async function createProblem(problem) {
    const formData = new FormData();
    formData.append("category", problem.category); 
    formData.append("title", problem.title);
    formData.append("description", problem.description);
    if (problem.photoFile instanceof File) {
        formData.append("photo_url", problem.photoFile);
    }
    const raw = await fetchJson("/me/complaints/", { method: "POST", body: formData });
    return normalizeComplaint(raw);
}

export async function fetchMyProblems() {
    try {
       const data = await fetchJson("/me/complaints/");
       if (Array.isArray(data)) return data.map(normalizeComplaint).filter(Boolean).sort(sortByNew);
    } catch (e) { console.warn(e); }
    return [];
}

export async function fetchApprovedComplaints(sort = "new") {
    try {
        const data = await fetchJson("/complaints/");
        if (Array.isArray(data)) {
            const approved = data.map(normalizeComplaint).filter(c => c && c.status === 'approved');
            if (sort === 'popular') approved.sort((a, b) => b.votesCount - a.votesCount);
            else approved.sort(sortByNew);
            return approved;
        }
    } catch(e) { console.warn("Fetch error:", e); }
    return [];
}

export async function fetchPendingComplaints() {
    try {
        const data = await fetchJson("/complaints/");
        if (Array.isArray(data)) return data.map(normalizeComplaint).filter(c => c && c.status === 'pending').sort(sortByNew);
    } catch(e) { console.warn(e); }
    return [];
}

export async function fetchRejectedComplaints() {
    try {
        const data = await fetchJson("/complaints/");
        if (Array.isArray(data)) return data.map(normalizeComplaint).filter(c => c && c.status === 'rejected').sort(sortByNew);
    } catch(e) { console.warn(e); }
    return [];
}

export async function fetchComplaintsByStatus(targetStatus) {
    try {
        const data = await fetchJson("/complaints/");
        if (Array.isArray(data)) return data.map(normalizeComplaint).filter(c => c && c.status === targetStatus).sort(sortByNew);
    } catch(e) { console.warn(e); }
    return [];
}

export async function deleteProblem(id) {
    await fetchJson(`/me/complaints/${id}/`, { method: "DELETE" });
    return true;
}

export async function updateComplaintStatus(id, newStatus) {
    let backendStatus = newStatus;
    if (newStatus === 'approved') backendStatus = 'published';
    if (newStatus === 'rejected') backendStatus = 'denied';

    const formData = new FormData();
    formData.append("status", backendStatus);

    await fetchJson(`/admin/complaints/${id}/status/`, { method: "PATCH", body: formData });
    return { id, status: newStatus };
}

export async function approveComplaint(id) {
    return updateComplaintStatus(id, "approved");
}

export async function voteComplaint(id) {
    const res = await fetchJson(`/complaints/${id}/vote/`, { method: "PATCH" });
    return { id, votesCount: res.votes };
}

export async function fetchComments(complaintId) {
    try {
        const data = await fetchJson(`/complaints/${complaintId}/comments/`);
        return data.map(c => ({
            id: c.comment_id,
            text: c.description,
            author: c.user_name || "Користувач",
            author_id: c.user,
            date: c.created_at
        }));
    } catch (e) {
        console.warn("Fetch comments error:", e);
        return [];
    }
}

export async function postComment(complaintId, text) {
    const data = await fetchJson(`/complaints/${complaintId}/comments/`, {
        method: "POST",
        body: { description: text }
    });
    return {
        id: data.comment_id,
        text: data.description,
        author: data.user_name || "Ви",
        author_id: data.user,
        date: data.created_at
    };
}

export async function deleteComment(commentId) {
    await fetchJson(`/comments/${commentId}/`, { method: "DELETE" });
}

