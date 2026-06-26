import { useEffect, useState } from "react";
import { 
  fetchMyProblems, 
  deleteProblem, 
  fetchComments, 
  deleteComment, 
  fetchUserProfile, 
  CATEGORY_LABELS 
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import Preloader from "../components/Preloader";

const statusBadge = (status) => {
  const s = String(status || "new").toLowerCase();
  if (s === "urgent" || s === "rejected") return "bg-red-100 text-red-700";
  if (s === "pending") return "bg-amber-100 text-amber-700";
  if (s === "resolved") return "bg-emerald-100 text-emerald-700";
  if (s === "approved") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
};

const statusText = (status) => {
  const s = String(status || "new").toLowerCase();
  if (s === "pending") return "Очікує";
  if (s === "approved") return "Активно";
  if (s === "rejected") return "Відхилено";
  if (s === "resolved") return "Вирішено";
  return status;
};

const categoryBadge = (category) => {
  const c = String(category || "").toLowerCase();
  if (c === "plumbing") return "bg-blue-100 text-blue-700";
  if (c === "electricity") return "bg-yellow-100 text-yellow-700";
  if (c === "furniture") return "bg-purple-100 text-purple-700";
  if (c === "internet") return "bg-green-100 text-green-700";
  return "bg-slate-100 text-slate-600";
};

const UserPage = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [commentsData, setCommentsData] = useState({});

  useEffect(() => {
    let alive = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [data, user] = await Promise.all([
           fetchMyProblems(),
           fetchUserProfile().catch(() => null)
        ]);
        if (!alive) return;
        setProblems(Array.isArray(data) ? data : []);
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to fetch user problems", e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadData();

    window.addEventListener('profileUpdated', loadData);
    
    return () => { 
      alive = false; 
      window.removeEventListener('profileUpdated', loadData);
    };
  }, []);

  const onDelete = async (id) => {
    if (!confirm("Видалити звернення?")) return;
    try {
      await deleteProblem(id);
      setProblems(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert("Не вдалось видалити (можливо, помилка сервера)");
    }
  };

  const toggleComments = async (id) => {
    if (openCommentsId === id) {
        setOpenCommentsId(null);
    } else {
        setOpenCommentsId(id);
        if (!commentsData[id]) {
            const comms = await fetchComments(id);
            setCommentsData(prev => ({ ...prev, [id]: comms }));
        }
    }
  };

  const handleDeleteComment = async (complaintId, commentId) => {
      if (!confirm("Видалити цей коментар?")) return;
      try {
          await deleteComment(commentId);
          setCommentsData(prev => ({
              ...prev,
              [complaintId]: prev[complaintId].filter(c => c.id !== commentId)
          }));
      } catch (e) {
          alert("Помилка видалення коментаря");
      }
  };

  const visible = problems
    .slice()
    .sort((a, b) => {
      if (activeTab === "popular") {
          return (b.votesCount || 0) - (a.votesCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) return <Preloader />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 lg:mb-10 gap-4">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Мої звернення
        </h2>

        <div className="bg-white p-1 rounded-xl border border-slate-200 flex w-fit">
          <button onClick={() => setActiveTab("new")} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${ activeTab === "new" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
            Усі
          </button>
          <button onClick={() => setActiveTab("popular")} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${ activeTab === "popular" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
            Популярні
          </button>
        </div>
      </div>

      {visible.length === 0 && (
        <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 lg:p-10 text-center">
          <p className="text-sm sm:text-base text-slate-600 font-bold">Немає звернень</p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {visible.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 text-[9px] sm:text-[10px] font-black rounded-md uppercase ${statusBadge(p.status)}`}>
                    {statusText(p.status)}
                  </span>
                  <span className={`px-2 py-1 text-[9px] sm:text-[10px] font-black rounded-md uppercase ${categoryBadge(p.category)}`}>
                    {CATEGORY_LABELS[p.category] || p.category || "Інше"}
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 sm:mb-3">
                {p.title || "Звернення"}
              </h3>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {p.description || "—"}
              </p>

              {p.photoUrl && (
                <div className="w-full h-48 sm:h-64 rounded-xl sm:rounded-2xl overflow-hidden shadow-inner bg-slate-100 mt-4 sm:mt-6">
                  <img
                    src={resolveImageUrl(p.thumbnail || p.photoUrl)}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100 gap-3">
                <div className="flex items-center gap-4">
                    <div className="text-xs sm:text-sm font-bold text-slate-700">
                      {typeof p.votesCount === "number" ? `${p.votesCount} голосів` : "0 голосів"}
                    </div>
                    <button onClick={() => toggleComments(p.id)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                      💬 Коментарі {openCommentsId === p.id ? '▲' : '▼'}
                    </button>
                </div>

                <button onClick={() => onDelete(p.id)} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded-lg sm:rounded-xl text-xs font-bold hover:bg-red-100 transition-all w-fit">
                  Видалити
                </button>
              </div>
            </div>

            {openCommentsId === p.id && (
                <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-100">
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {(commentsData[p.id] || []).length === 0 ? (
                            <p className="text-center text-xs text-slate-400 font-medium">Поки немає коментарів.</p>
                        ) : (
                            (commentsData[p.id] || []).map(c => (
                                <div key={c.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 relative group">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-xs font-bold text-slate-800">{c.author}</span>
                                        <span className="text-[9px] text-slate-400 font-bold">{new Date(c.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-600">{c.text}</p>
                                    
                        
                                    {(currentUser?.user === c.author_id || currentUser?.is_admin) && (
                                        <button 
                                            onClick={() => handleDeleteComment(p.id, c.id)}
                                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Видалити"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPage;