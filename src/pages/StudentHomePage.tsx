import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCampusStatus, fetchUserProfile, fetchAnnouncementsHistory } from "../services/problemsApi";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import LoadingSpinner from "../components/LoadingSpinner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  TaskDone01Icon,
  AddIcon,
  File01Icon,
  Activity01Icon,
  ShieldIcon
} from "@hugeicons/core-free-icons";

export default function StudentHomePage() {
  const [user, setUser] = useState<any>(null);
  const [campusStatus, setCampusStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [announcementsModalOpen, setAnnouncementsModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const loadAnnouncementsHistory = async () => {
    try {
      const data = await fetchAnnouncementsHistory();
      setAnnouncements(data);
    } catch (e) {
      console.warn("Failed to load announcements history", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [profile, statusData, historyData] = await Promise.all([
          fetchUserProfile().catch(() => null),
          fetchCampusStatus().catch(() => null),
          fetchAnnouncementsHistory().catch(() => []),
        ]);
        if (profile) setUser(profile);
        if (statusData) setCampusStatus(statusData);
        if (historyData) setAnnouncements(historyData);
      } catch (e) {
        console.warn("Failed to initialize student home page", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (announcementsModalOpen) {
      loadAnnouncementsHistory();
    }
  }, [announcementsModalOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const firstName = user?.first_name || "Студент";

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "warning":
        return (
          <div className="flex items-center gap-2 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
            </span>
            <span>Ремонт</span>
          </div>
        );
      case "critical":
        return (
          <div className="flex items-center gap-2 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500 animate-pulse"></span>
            </span>
            <span>Аварія</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <span>Стабільно</span>
          </div>
        );
    }
  };

  const getStatusBorder = (status?: string) => {
    if (status === "warning") return "border-l-4 border-l-yellow-500";
    if (status === "critical") return "border-l-4 border-l-red-500";
    return "border-l-4 border-l-green-500";
  };

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Greeting & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-6 rounded-lg shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Вітаємо в DormWatch, {firstName}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Ваш персональний інформаційний хаб та стан житлових систем гуртожитку
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button asChild size="default" className="gap-2 font-semibold">
              <Link to="/create-report">
                <HugeiconsIcon icon={AddIcon} className="size-4" strokeWidth={2.5} />
                Створити заявку
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="gap-2 font-semibold">
              <Link to="/user">
                <HugeiconsIcon icon={File01Icon} className="size-4" strokeWidth={2.5} />
                Мій кабінет
              </Link>
            </Button>
          </div>
        </div>

        {/* Global Announcement Alert Banner */}
        {campusStatus?.announcement_text ? (
          <Card className="backdrop-blur-md bg-blue-500/5 border border-blue-500/25 p-6 shadow-xl shadow-blue-500/5 relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-500/80" />
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <span className="text-3xl">📢</span>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-blue-400">
                    {campusStatus.announcement_title || "Важлива інформація від коменданта"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {campusStatus.announcement_text}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400 font-bold rounded-lg shadow-sm"
                onClick={() => setAnnouncementsModalOpen(true)}
              >
                Всі оголошення
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="backdrop-blur-md bg-card/60 border border-border/80 p-6 shadow-sm flex items-center justify-between gap-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📢</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Немає активних оголошень</h3>
                <p className="text-xs text-muted-foreground">Наразі важливих оголошень від адміністрації немає.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-lg"
              onClick={() => setAnnouncementsModalOpen(true)}
            >
              Переглянути всі оголошення
            </Button>
          </Card>
        )}

        {/* Utilities Status Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            ⚡ Моніторинг комунальних систем
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <Card className={`bg-card border border-border p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 ${getStatusBorder(campusStatus?.water_status)}`}>
              <div className="flex justify-between items-start">
                <span className="text-2xl">💧</span>
                {renderStatusBadge(campusStatus?.water_status)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Водопостачання</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Гаряча та холодна вода</p>
              </div>
            </Card>

            <Card className={`bg-card border border-border p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 ${getStatusBorder(campusStatus?.electricity_status)}`}>
              <div className="flex justify-between items-start">
                <span className="text-2xl">⚡</span>
                {renderStatusBadge(campusStatus?.electricity_status)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Електромережа</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Напруга та розетки</p>
              </div>
            </Card>

            <Card className={`bg-card border border-border p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 ${getStatusBorder(campusStatus?.heating_status)}`}>
              <div className="flex justify-between items-start">
                <span className="text-2xl">🌡️</span>
                {renderStatusBadge(campusStatus?.heating_status)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Опалення</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Температура батарей</p>
              </div>
            </Card>

            <Card className={`bg-card border border-border p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 ${getStatusBorder(campusStatus?.internet_status)}`}>
              <div className="flex justify-between items-start">
                <span className="text-2xl">🌐</span>
                {renderStatusBadge(campusStatus?.internet_status)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Інтернет</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Wi-Fi та локальна мережа</p>
              </div>
            </Card>

            <Card className={`bg-card border border-border p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 ${getStatusBorder(campusStatus?.elevators_status)}`}>
              <div className="flex justify-between items-start">
                <span className="text-2xl">🛗</span>
                {renderStatusBadge(campusStatus?.elevators_status)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Ліфти</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Пасажирські підйомники</p>
              </div>
            </Card>

          </div>
        </div>

        {/* Weekly Dormitory Statistics */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            📊 Статистика задоволеності та ефективності
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <Card className="border-l-4 border-l-blue-500 bg-card border border-border p-5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <HugeiconsIcon icon={TaskDone01Icon} className="size-4" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-blue-400">14 заяв</p>
                <p className="text-xs font-semibold text-foreground mt-1">Вирішено цього тижня</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Всі неполадки успішно усунено.</p>
              </div>
            </Card>

            <Card className="border-l-4 border-l-yellow-500 bg-card border border-border p-5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <HugeiconsIcon icon={Activity01Icon} className="size-4" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-yellow-400">2.5 год</p>
                <p className="text-xs font-semibold text-foreground mt-1">Сер. час реакції</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Від створення до прибуття майстра.</p>
              </div>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-card border border-border p-5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                <HugeiconsIcon icon={ShieldIcon} className="size-4" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-green-400">98%</p>
                <p className="text-xs font-semibold text-foreground mt-1">Рівень задоволеності</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">За оцінками мешканців гуртожитку.</p>
              </div>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-card border border-border p-5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <HugeiconsIcon icon={Building03Icon} className="size-4" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-purple-400">4 майстри</p>
                <p className="text-xs font-semibold text-foreground mt-1">Чергових на зміні</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Сантехніки, електрики та теслярі.</p>
              </div>
            </Card>

          </div>
        </div>

        {/* Useful Dormitory Information & Helplines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="border border-border bg-card p-6 space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/50">
              📞 Екстрені контакти гуртожитку
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-muted/40 rounded border border-border/50">
                <p className="font-bold text-foreground">🛡️ Черговий вахтер (Корпус 1)</p>
                <p className="text-muted-foreground mt-1">+38 (044) 123-45-67</p>
              </div>
              <div className="p-3 bg-muted/40 rounded border border-border/50">
                <p className="font-bold text-foreground">🛡️ Черговий вахтер (Корпус 2)</p>
                <p className="text-muted-foreground mt-1">+38 (044) 123-45-68</p>
              </div>
              <div className="p-3 bg-muted/40 rounded border border-border/50">
                <p className="font-bold text-foreground">💼 Кабінет коменданта</p>
                <p className="text-muted-foreground mt-1">Пн-Пт 09:00 - 18:00</p>
              </div>
              <div className="p-3 bg-muted/40 rounded border border-border/50">
                <p className="font-bold text-foreground">🚑 Швидка допомога / МНС</p>
                <p className="text-muted-foreground mt-1">103 / 101 (цілодобово)</p>
              </div>
            </div>
          </Card>

          <Card className="border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/50">
              💡 Інформація
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              DormWatch створений для швидкого усунення побутових несправностей. Створюйте заявки, додавайте фото, відстежуйте виконання онлайн. Спільними зусиллями зробимо наш кампус кращим!
            </p>
            <Separator />
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Версія системи</span>
              <span className="font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">v2.0.1</span>
            </div>
          </Card>

        </div>

        <Dialog open={announcementsModalOpen} onOpenChange={setAnnouncementsModalOpen}>
          <DialogContent className="max-w-md bg-card border-border data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-12 data-[state=open]:duration-300 duration-200 ease-out">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                📢 Архів оголошень адміністрації
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 mt-2">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Історія оголошень порожня.
                </div>
              ) : (
                announcements.map((item, idx) => (
                  <div key={item.announcement_id || idx} className={`p-4 rounded-lg border ${idx === 0 ? 'bg-blue-500/5 border-blue-500/20' : 'bg-muted/40 border-border/50'}`}>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      {idx === 0 && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Останнє
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <h4 className={`text-sm font-bold mb-1 ${idx === 0 ? 'text-blue-400' : 'text-foreground'}`}>
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {item.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
