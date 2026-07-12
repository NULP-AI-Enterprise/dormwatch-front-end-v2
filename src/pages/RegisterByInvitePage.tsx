import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchInviteDetails, registerByInvite } from "../services/problemsApi";
import { useUser } from "../context/UserContext";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../components/ui/form";

const inviteRegisterSchema = z.object({
  first_name: z.string().min(1, "Ім'я обов'язкове"),
  last_name: z.string().min(1, "Прізвище обов'язкове"),
  email: z.string().min(1, "Email обов'язковий").email("Невірний формат email"),
  password: z.string()
    .min(8, "Пароль має бути щонайменше 8 символів")
    .refine((v) => /[a-zA-Zа-яА-ЯёЁіІїЇєЄґҐ]/.test(v), "Пароль повинен містити хоча б одну літеру")
    .refine((v) => /[0-9]/.test(v), "Пароль повинен містити хоча б одну цифру"),
  confirm_password: z.string().min(1, "Підтвердження пароля обов'язкове"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Паролі не співпадають",
  path: ["confirm_password"],
});

type InviteRegisterData = z.infer<typeof inviteRegisterSchema>;

function translateError(msg: string): string {
  const m = msg.trim().toLowerCase();
  
  if (m.includes("already exists") || m.includes("exists")) {
    return "Користувач з такою електронною поштою вже існує.";
  }
  
  if (m.includes("required")) {
    return "Будь ласка, заповніть усі обов'язкові поля.";
  }
  
  if (m.includes("password is too short")) {
    return "Пароль має бути щонайменше 8 символів.";
  }
  
  if (m.includes("digits only")) {
    return "Пароль не може складатися лише з цифр.";
  }

  if (m.includes("letters only")) {
    return "Пароль не може складатися лише з літер.";
  }
  
  return msg;
}

export default function RegisterByInvitePage() {
  const navigate = useNavigate();
  const { refreshUser } = useUser();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"admin" | "worker" | "">("");
  const [loading, setLoading] = useState(false);

  const form = useForm<InviteRegisterData>({
    resolver: zodResolver(inviteRegisterSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setError("Посилання для запрошення не знайдено або воно некоректне.");
      setChecking(false);
      return;
    }

    const checkToken = async () => {
      try {
        const details = await fetchInviteDetails(token);
        if (details && details.valid) {
          setRole(details.role);
        } else {
          setError("Посилання для запрошення є недійсним або вже було використане.");
        }
      } catch (err: any) {
        setError("Посилання для запрошення є недійсним або вже було використане.");
      } finally {
        setChecking(false);
      }
    };

    checkToken();
  }, [token]);

  const onSubmit = async (data: InviteRegisterData) => {
    setLoading(true);
    setError("");
    try {
      await registerByInvite(token, {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
      });

      await refreshUser();

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/worker");
      }
    } catch (err: any) {
      let rawMsg = "Помилка при реєстрації.";
      try {
        const parsed = JSON.parse(err.message);
        const firstErr = Object.values(parsed)[0];
        rawMsg = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
      } catch {
        rawMsg = err.message || rawMsg;
      }
      setError(translateError(rawMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 relative overflow-hidden bg-background">
      <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />

      <div className="w-full max-w-lg relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-2">
            <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-8" />
            <span>DormWatch</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Реєстрація за запрошенням</h1>
          {role && (
            <p className="text-muted-foreground text-sm mt-2 text-center">
              Створення акаунту: <span className="font-bold text-foreground capitalize">{role === "admin" ? "Адміністратор" : "Працівник"}</span>
            </p>
          )}
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardContent className="pt-6">
            {checking ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground font-semibold">Перевірка посилання запрошення...</p>
              </div>
            ) : error && !role ? (
              <div className="py-6 text-center space-y-4">
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-lg">
                  {error}
                </div>
                <p className="text-xs text-muted-foreground">
                  Зверніться до адміністратора, щоб отримати нове одноразове посилання для реєстрації.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <div className="border border-destructive/45 bg-destructive/10 px-3 py-2.5 rounded-lg">
                      <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-foreground">Ім'я</FormLabel>
                          <FormControl>
                            <Input placeholder="Іван" {...field} className="h-9 text-xs" disabled={loading} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-foreground">Прізвище</FormLabel>
                          <FormControl>
                            <Input placeholder="Петренко" {...field} className="h-9 text-xs" disabled={loading} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="ivan.petrenko@gmail.com" {...field} className="h-9 text-xs" disabled={loading} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Пароль</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-9 text-xs" disabled={loading} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Підтвердження пароля</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-9 text-xs" disabled={loading} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full text-xs font-semibold h-9 mt-2" disabled={loading}>
                    {loading ? "Реєстрація..." : "Зареєструватися"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 group-hover:-translate-x-1 transition-transform" />
            Повернутися на головну
          </Link>
        </div>
      </div>
    </div>
  );
}
