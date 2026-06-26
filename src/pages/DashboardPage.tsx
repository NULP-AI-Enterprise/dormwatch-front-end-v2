import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchApprovedComplaints,
  fetchUserProfile,
  deleteProblem,
  voteComplaint,
  fetchComments,
  postComment,
  deleteComment,
  CATEGORY_LABELS,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import { ChevronUp, MessageSquare, X, Search, Trash2, Send } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../components/ui/dialog";
import { statusBadgeClass, statusLabel } from "../lib/complaintUtils";

const categories = [
  { id: "all", name: "Всі" },
  { id: "plumbing", name: "Сантехніка" },
  { id: "electricity", name: "Електрика" },
  { id: "furniture", name: "Меблі" },
  { id: "internet", name: "Інтернет" },
];

const DashboardPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCorps, setActiveCorps] = useState("all");
  const [activePriority, setActivePriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);
  const [commentsData, setCommentsData] = useState<Record<number, any[]>>({});
  const [commentInput, setCommentInput] = useState("");

  const [votedIds, setVotedIds] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [complaintsData, userData] = await Promise.all([
          fetchApprovedComplaints("new", { corps: activeCorps, priority: activePriority }).catch(() => []),
          fetchUserProfile().catch(() => null),
        ]);
        if (Array.isArray(complaintsData)) setProblems(complaintsData);
        setCurrentUser(userData);
      } catch (error) {
        console.error("Critical dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeCorps, activePriority]);

    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<{ complaintId: number; commentId: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteProblem(deleteTarget);
      setProblems((prev) => prev.filter((p) => p.id !== deleteTarget));
    } catch {
      setErrorMessage("Помилка при видаленні");
    } finally {
      setDeleteTarget(null);
    }
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentTarget) return;
    try {
      await deleteComment(deleteCommentTarget.commentId);
      setCommentsData((prev) => ({
        ...prev,
        [deleteCommentTarget.complaintId]: prev[deleteCommentTarget.complaintId].filter((c: any) => c.id !== deleteCommentTarget.commentId),
      }));
    } catch {
      setErrorMessage("Помилка видалення коментаря");
    } finally {
      setDeleteCommentTarget(null);
    }
  };

  const handleVote = async (id: number) => {
    if (votedIds.includes(id)) return;

    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, votesCount: p.votesCount + 1 } : p))
    );

    try {
      const res = await voteComplaint(id);
      setProblems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, votesCount: res.votesCount } : p))
      );
      setVotedIds((prev) => [...prev, id]);
    } catch {
      setVotedIds((prev) => [...prev, id]);
      setProblems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, votesCount: p.votesCount - 1 } : p))
      );
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

  const handleSendComment = async (id: number) => {
    if (!commentInput.trim()) return;
    try {
      await postComment(id, commentInput);
      const comms = await fetchComments(id);
      setCommentsData((prev) => ({ ...prev, [id]: comms }));
      setCommentInput("");
    } catch {
      setErrorMessage("Не вдалось відправити коментар");
    }
  };

  const handleDeleteComment = (complaintId: number, commentId: number) => {
    setDeleteCommentTarget({ complaintId, commentId });
  };

  const filteredProblems = problems.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isAdmin =
    currentUser?.role &&
    ["admin", "адміністратор"].includes(
      (currentUser.role.role_name || "").toLowerCase()
    );

  const canManage = (problem: any) =>
    isAdmin || currentUser?.user === problem.user_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl bg-stone-900/95 border-border p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {previewImage && (
            <img
              src={previewImage}
              className="w-full h-auto max-h-[90vh] object-contain"
              alt="Full size"
            />
          )}
          <DialogClose className="absolute top-4 right-4 text-foreground hover:text-stone-300">
            <X className="w-6 h-6" strokeWidth={2} />
          </DialogClose>
        </DialogContent>
      </Dialog>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Стрічка проблем
            </h1>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" strokeWidth={2} />
                <Input
                  placeholder="Пошук заявок..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Select value={activeCorps} onValueChange={setActiveCorps}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Всі гуртожитки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі гуртожитки</SelectItem>
                  <SelectItem value="Гуртожиток 1">Гуртожиток 1</SelectItem>
                  <SelectItem value="Гуртожиток 2">Гуртожиток 2</SelectItem>
                  <SelectItem value="Гуртожиток 3">Гуртожиток 3</SelectItem>
                  <SelectItem value="Гуртожиток 4">Гуртожиток 4</SelectItem>
                  <SelectItem value="Гуртожиток 5">Гуртожиток 5</SelectItem>
                  <SelectItem value="Гуртожиток 6">Гуртожиток 6</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activePriority} onValueChange={setActivePriority}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Всі пріоритети" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі пріоритети</SelectItem>
                  <SelectItem value="low">Низький</SelectItem>
                  <SelectItem value="medium">Середній</SelectItem>
                  <SelectItem value="high">Високий</SelectItem>
                  <SelectItem value="critical">Критичний</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-3 py-1.5 border text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent border-border text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {filteredProblems.map((problem) => {
              const hasVoted = votedIds.includes(problem.id);
              const cmts = commentsData[problem.id] || [];

              return (
                <Card
                  key={problem.id}
                  className="border-border shadow-none group relative"
                >
                  {canManage(problem) && (
                    <button
                      onClick={() => handleDelete(problem.id)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-card text-destructive border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Видалити"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  )}

                  <div className="flex">
                    <div className="flex-shrink-0 p-5 border-r border-dashed border-border flex flex-col items-center gap-0.5 min-w-[72px]">
                      <button
                        onClick={() => handleVote(problem.id)}
                        disabled={hasVoted}
                        className={`flex flex-col items-center gap-0.5 p-2 border transition-colors ${
                          hasVoted
                            ? "bg-primary text-primary-foreground border-primary cursor-default"
                            : "bg-muted border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        }`}
                      >
                        <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
                        <span className="text-base font-bold leading-none">
                          {problem.votesCount || 0}
                        </span>
                        <span className="text-[8px] font-semibold uppercase tracking-tight">
                          {hasVoted ? "Ваш голос" : "Голос"}
                        </span>
                      </button>
                    </div>

                    <div className="flex-1 p-5">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={statusBadgeClass(problem.status)}>
                            {statusLabel(problem.status)}
                          </Badge>
                          <Badge variant="outline" className="text-muted-foreground border-border bg-muted">
                            {categories.find((c) => c.id === problem.category)?.name || problem.category}
                          </Badge>
                        </div>
                        <span className="micro-label">
                          {problem.building ? `Корпус ${problem.building}` : ""} &middot; {problem.placeName}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {problem.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        {problem.description}
                      </p>

                      {problem.photoUrl && (
                        <div
                          className="w-full h-40 overflow-hidden border border-border mb-4 cursor-zoom-in"
                          onClick={() => setPreviewImage(resolveImageUrl(problem.photoUrl))}
                        >
                          <img
                            src={resolveImageUrl(problem.thumbnail || problem.photoUrl)}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            alt=""
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-dashed border-border">
                        <span className="micro-label">
                          Додано{" "}
                          {new Date(problem.createdAt).toLocaleDateString()}
                        </span>
                        {canManage(problem) && (
                          <button
                            onClick={() => toggleComments(problem.id)}
                            className="text-primary text-xs font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" strokeWidth={2} />
                            Коментарі {openCommentsId === problem.id ? "▲" : "▼"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {openCommentsId === problem.id && (
                    <div className="bg-muted/30 border-t border-dashed border-border p-4">
                      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                        {cmts.length === 0 ? (
                          <p className="text-center text-xs text-muted-foreground font-medium">
                            Поки немає коментарів
                          </p>
                        ) : (
                          cmts.map((c: any) => (
                            <div
                              key={c.id}
                              className="bg-card p-3 border border-border relative group/comment"
                            >
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xs font-bold text-foreground">
                                  {c.author}
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  {new Date(c.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{c.text}</p>
                              {(currentUser?.user === c.author_id || isAdmin) && (
                                <button
                                  onClick={() => handleDeleteComment(problem.id, c.id)}
                                  className="absolute top-1 right-1 text-destructive opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" strokeWidth={2} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Написати коментар..."
                          className="flex-1"
                          onKeyDown={(e) => e.key === "Enter" && handleSendComment(problem.id)}
                        />
                        <Button
                          size="sm"
                          className="inline-flex items-center gap-1"
                          onClick={() => handleSendComment(problem.id)}
                        >
                          <Send className="w-3 h-3" strokeWidth={2} />
                          Відправити
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {filteredProblems.length === 0 && (
              <div className="empty-state">
                <p className="text-xs text-muted-foreground">
                  Заявок поки немає.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-primary p-6 text-primary-foreground">
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4">
                Дії
              </h4>
              {isAdmin ? (
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/80 text-[10px] font-bold uppercase tracking-wider"
                >
                  <Link to="/admin">Перейти в комендант-центр</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/80 text-[10px] font-bold uppercase tracking-wider"
                >
                  <Link to="/create-report">Створити нову заявку</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити заявку?</AlertDialogTitle>
            <AlertDialogDescription>Цю дію не можна скасувати.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCommentTarget !== null} onOpenChange={(open) => { if (!open) setDeleteCommentTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити коментар?</AlertDialogTitle>
            <AlertDialogDescription>Цю дію не можна скасувати.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteComment}>Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!errorMessage} onOpenChange={(open) => { if (!open) setErrorMessage(null); }}>
        <DialogContent>
          <DialogTitle>Помилка</DialogTitle>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <DialogClose asChild>
            <Button variant="outline" className="mt-2" onClick={() => setErrorMessage(null)}>OK</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage;
