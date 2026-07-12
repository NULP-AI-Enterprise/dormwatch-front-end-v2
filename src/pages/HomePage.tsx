import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchUserProfile } from "../services/problemsApi";
import { Button } from "../components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Building03Icon, Camera01Icon, Activity01Icon, ShieldIcon } from "@hugeicons/core-free-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import Footer from "../components/Footer";
import { Separator } from "../components/ui/separator";
import { isAdminUser, isWorkerUser, getUserInitials } from "../lib/complaintUtils";
import { SettingsModal } from "../components/SettingsModal";

const HomePage = () => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const profile = await fetchUserProfile();
        if (!mounted) return;
        if (profile) {
          setUser(profile);
          // Redirect admin/worker directly to their panel
          if (isAdminUser(profile)) {
            navigate("/admin", { replace: true });
            return;
          }
          if (isWorkerUser(profile)) {
            navigate("/worker", { replace: true });
            return;
          }
        }
      } catch {
        // not logged in — show landing
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, [navigate]);

  const dashboardPath = user
    ? isAdminUser(user)
      ? "/admin"
      : isWorkerUser(user)
      ? "/worker"
      : "/home"
    : "/auth";

  const panelPath = user
    ? isAdminUser(user)
      ? "/admin/control-panel"
      : isWorkerUser(user)
      ? "/worker"
      : "/user"
    : "/auth";


  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const initials = getUserInitials(user, "U");

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight cursor-pointer hover:opacity-85 transition-opacity"
          >
            <HugeiconsIcon icon={Building03Icon} className="size-6" strokeWidth={1.5} />
            <span>DormWatch</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#how-it-works" onClick={(e) => handleScrollTo(e, "how-it-works")} className="hover:text-foreground transition-colors">Як це працює</a>
            <a href="#faq" onClick={(e) => handleScrollTo(e, "faq")} className="hover:text-foreground transition-colors">Поширені запитання</a>
            <a href="#emergency" onClick={(e) => handleScrollTo(e, "emergency")} className="hover:text-foreground transition-colors">Екстрені контакти</a>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Button
                variant="ghost"
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 rounded-full p-0 bg-muted hover:bg-muted/80 border border-border flex items-center justify-center text-foreground font-bold text-sm"
              >
                {initials}
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-sm font-semibold hover:text-foreground">
                  <Link to="/auth?tab=login">
                    Увійти
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?tab=register">
                    Зареєструватися
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        <Separator />
      </nav>

      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 tracking-tight">
              Зламаний кран? Холодна кімната? <span className="text-blue-400">Ми допоможемо.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
              Створюйте заявки на ремонт у вашому гуртожитку менш ніж за 15 секунд. Відстежуйте оновлення статусу в режимі реального часу. Без завантаження додатків та очікування на лінії.
            </p>
            {user && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link to={dashboardPath}>
                    <HugeiconsIcon icon={Building03Icon} className="size-5" strokeWidth={2} />
                    На головну
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to={panelPath}>
                    {isAdminUser(user) || isWorkerUser(user) ? "Перейти до панелі" : "Перейти до кабінету"}
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" strokeWidth={2} />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="relative w-full aspect-square max-w-lg mx-auto lg:ml-auto">
            <div className="absolute inset-0 bg-card border border-border transform rotate-3 scale-95 opacity-50" />
            <div className="absolute inset-0 bg-card border border-border transform -rotate-2 scale-100 opacity-80" />
            <div className="absolute inset-0 bg-background border border-border shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-4">
                <div className="w-32 h-4 bg-card" />
              </div>
              <Separator />
              <div className="bg-card border border-border p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-muted-foreground font-semibold">Сантехніка</span>
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-700/50 text-xs font-semibold">Очікує</span>
                </div>
                <div className="w-3/4 h-3 bg-muted mb-2" />
                <div className="w-full h-2 bg-muted mb-1" />
                <div className="w-2/3 h-2 bg-muted" />
              </div>
              <div className="bg-card border border-border p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-muted-foreground font-semibold">Опалення</span>
                  <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-700/50 text-xs font-semibold">Активно</span>
                </div>
                <div className="w-1/2 h-3 bg-muted mb-2" />
                <div className="w-full h-2 bg-muted mb-1" />
                <div className="w-4/5 h-2 bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border">
          <div className="text-center px-4">
            <p className="text-3xl font-bold text-foreground mb-1">15с</p>
            <p className="text-xs text-muted-foreground font-semibold">На подачу заявки</p>
          </div>
          <div className="text-center px-4">
            <p className="text-3xl font-bold text-foreground mb-1">24/7</p>
            <p className="text-xs text-muted-foreground font-semibold">Екстрена підтримка</p>
          </div>
          <div className="text-center px-4">
            <p className="text-3xl font-bold text-foreground mb-1">100%</p>
            <p className="text-xs text-muted-foreground font-semibold">Охоплення кампусу</p>
          </div>
          <div className="text-center px-4">
            <p className="text-3xl font-bold text-foreground mb-1">Прямий</p>
            <p className="text-xs text-muted-foreground font-semibold">Зв'язок із майстрами</p>
          </div>
        </div>
      </div>
      <Separator />

      <section className="py-24 max-w-7xl mx-auto px-6" id="how-it-works">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Більше жодних загублених заявок.</h2>
          <p className="text-muted-foreground max-w-2xl text-lg">Ми замінили незручні паперові форми та проігноровані електронні листи на чітку, прозору систему заявок, яка дійсно працює.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-8 relative group hover:border-stone-500 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-background border border-border mb-6 flex items-center justify-center">
              <HugeiconsIcon icon={Camera01Icon} className="size-6 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Сфотографуйте та надішліть</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Не намагайтеся пояснити, де протікає. Просто зробіть photo, вкажіть номер кімнати, і наша система автоматично направить заявку до потрібного відділу.
            </p>
          </div>
          <div className="bg-card border border-border p-8 relative group hover:border-stone-500 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-background border border-border mb-6 flex items-center justify-center">
              <HugeiconsIcon icon={Activity01Icon} className="size-6 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Прозоре відстеження</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Припиніть гадати, чи бачив хтось вашу заявку. Отримуйте оновлення статусу в реальному часі, коли ваша заявка переглядається, призначається майстру та вирішується.
            </p>
          </div>
          <div className="bg-card border border-border p-8 relative group hover:border-stone-500 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-background border border-border mb-6 flex items-center justify-center">
              <HugeiconsIcon icon={ShieldIcon} className="size-6 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Екстрене реагування</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Критичні проблеми, такі як відключення електроенергії або затоплення, миттєво позначаються та надсилаються черговій бригаді аварійної служби.
            </p>
          </div>
        </div>
      </section>

      <Separator />
      <section className="bg-background py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold text-foreground mb-6">Потрібно щось полагодити?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            {user
              ? "Перейдіть до особистого кабінету, щоб переглянути ваші скарги чи створити нові."
              : "Увійдіть за допомогою студентського квитка, щоб надіслати заявку безпосередньо до служби експлуатації кампусу."}
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link to={dashboardPath}>
                {user ? "Перейти до кабінету" : "Розпочати"}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" strokeWidth={2} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <Separator />

      <Footer />
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
};

export default HomePage;
