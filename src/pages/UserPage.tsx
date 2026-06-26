import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchMyProblems,
  deleteProblem,
  fetchComments,
  deleteComment,
  fetchUserProfile,
  CATEGORY_LABELS,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TicketCard } from "../components/TicketCard";
import CommunityBoard from "../components/CommunityBoard";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { statusBadgeClass, statusLabel } from "../lib/complaintUtils";
import {
  Trash2,
  MessageSquare,
  X,
  MapPin,
  ArrowRight,
  Wrench,
} from "lucide-react";

const UserPage = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);
  const [commentsData, setCommentsData] = useState<Record<number, any[]>>({});

  useEffect(() => {
    let alive = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const user = await fetchUserProfile().catch(() => null);
        if (!alive) return;
        setCurrentUser(user);
        if (!user) {
          navigate("/");
          return;
        }
        const data = await fetchMyProblems();
        if (!alive) return;
        setProblems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch user data", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadData();
    return () => { alive = false; };
  }, [navigate]);

  const onDelete = async (id: number) => {
    try {
      await deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently fail
    }
  };

  const toggleComments = async (id: number) => {
    if (openCommentsId === id) {
      setOpenCommentsId(null);
    } else {
      setOpenCommentsId(id);
      if (!commentsData[id]) {
        const comms = await fetchComments(id);
        setCommentsData((prev) => ({ ...prev, [id]: comms }));
      }
    }
  };

  const handleDeleteComment = async (complaintId: number, commentId: number) => {
    try {
      await deleteComment(commentId);
      setCommentsData((prev) => ({
        ...prev,
        [complaintId]: prev[complaintId].filter((c: any) => c.id !== commentId),
      }));
    } catch {
      // silently fail
    }
  };

  const firstName = currentUser?.first_name || "User";
  const building = currentUser?.building || "";
  const room = currentUser?.room || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] dark bg-stone-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="dark bg-stone-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList variant="line" className="mb-8">
            <TabsTrigger value="dashboard" className="text-xs font-bold uppercase tracking-wider">
              Панель
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs font-bold uppercase tracking-wider">
              Мої заявки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-stone-50 tracking-tight">Hello, {firstName}!</h1>
              <p className="text-stone-400 mt-1 flex items-center gap-2 text-sm uppercase tracking-widest">
                <MapPin className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
                {building} &bull; Room {room}
              </p>
            </div>

            <Link
              to="/create-report"
              className="block w-full bg-blue-800 hover:bg-blue-900 border border-blue-700 p-6 mb-8 group/cta relative overflow-hidden transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-700 opacity-0 group-hover/cta:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                    <Wrench className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-white">Повідомити про проблему</p>
                    <p className="text-blue-100 text-sm mt-1">
                      Створіть нову заявку на ремонт у вашій кімнаті або загальних зонах.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-white relative z-10 group-hover/cta:translate-x-2 transition-transform" strokeWidth={2} />
              </div>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-stone-50">Активні заявки</h2>
                  <Link to="/dashboard" className="text-sm font-semibold text-blue-400 hover:text-blue-500">
                    Історія
                  </Link>
                </div>
                <div className="space-y-3">
                  {problems.length === 0 ? (
                    <div className="empty-state">
                      <p className="text-xs text-stone-400">Немає активних заявок.</p>
                    </div>
                  ) : (
                    problems.slice(0, 5).map((p) => (
                      <TicketCard
                        key={p.id}
                        id={p.id}
                        title={p.title}
                        description={p.description}
                        category={p.category}
                        date={new Date(p.createdAt).toLocaleDateString()}
                        status={p.status}
                        categoryLabel={CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS]}
                      />
                    ))
                  )}
                </div>
              </div>
              <div>
                <CommunityBoard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4">
              {problems.length === 0 && (
                <div className="empty-state">
                  <p className="text-sm font-bold text-stone-50 mb-1">Ще немає звернень</p>
                </div>
              )}

              {problems.map((p) => {
                const cmts = commentsData[p.id] || [];
                return (
                  <Card key={p.id} className="border-stone-700 shadow-none bg-stone-800">
                    <div className="flex">
                      <div className="flex-shrink-0 p-5 border-r border-dashed border-stone-700 flex flex-col items-center gap-0.5 min-w-[64px]">
                        <span className="text-base font-bold text-stone-50 leading-none">
                          {p.votesCount || 0}
                        </span>
                        <span className="text-[8px] font-semibold uppercase text-stone-400">
                          голосів
                        </span>
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={statusBadgeClass(p.status)}>
                              {statusLabel(p.status)}
                            </Badge>
                            <Badge variant="outline" className="text-stone-400 border-stone-700 bg-stone-800">
                              {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category || "Other"}
                            </Badge>
                          </div>
                          <span className="micro-label shrink-0">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-stone-50 mb-2">
                          {p.title || "Complaint"}
                        </h3>
                        <p className="text-xs text-stone-400 leading-relaxed mb-4">
                          {p.description || "\u2014"}
                        </p>

                        {p.photoUrl && (
                          <div className="w-full h-48 overflow-hidden border border-stone-700 mb-4">
                            <img
                              src={resolveImageUrl(p.thumbnail || p.photoUrl)}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-dashed border-stone-700">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-semibold text-stone-50">
                              {typeof p.votesCount === "number"
                                ? `${p.votesCount} голосів`
                                : "0 голосів"}
                            </span>
                            <button
                              onClick={() => toggleComments(p.id)}
                              className="text-blue-400 text-[10px] font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" strokeWidth={2} />
                              Коментарі{" "}
                              {openCommentsId === p.id ? "\u25b2" : "\u25bc"}
                            </button>
                          </div>
                          <button
                            onClick={() => onDelete(p.id)}
                            className="p-1.5 text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {openCommentsId === p.id && (
                      <div className="bg-stone-900/30 border-t border-dashed border-stone-700 p-4">
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {cmts.length === 0 ? (
                            <p className="text-center text-[10px] text-stone-400 font-medium">
                              Коментарів поки немає.
                            </p>
                          ) : (
                            cmts.map((c: any) => (
                              <div
                                key={c.id}
                                className="bg-stone-800 p-3 border border-stone-700 relative group/comment"
                              >
                                <div className="flex justify-between items-baseline mb-1">
                                  <span className="text-[11px] font-bold text-stone-50">
                                    {c.author}
                                  </span>
                                  <span className="text-[9px] text-stone-400">
                                    {new Date(c.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-400">{c.text}</p>
                                {(currentUser?.user === c.author_id ||
                                  currentUser?.is_admin) && (
                                  <button
                                    onClick={() => handleDeleteComment(p.id, c.id)}
                                    className="absolute top-1 right-1 text-red-400 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" strokeWidth={2} />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserPage;
