import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, LoaderCircle, PawPrint, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Вход в Собрано CRM" },
    { name: "description", content: "Войдите в Собрано CRM для управления клиентами, занятиями и оплатами." },
    { property: "og:title", content: "Вход в Собрано CRM" },
    { property: "og:description", content: "Управляйте клиентами, расписанием и оплатами в одном месте." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/import" });
    });
  }, [navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error("Не удалось войти", { description: error.message }); return; }
      toast.success("С возвращением!");
      await navigate({ to: "/import" });
      return;
    }
    const displayName = String(form.get("displayName") ?? "").trim();
    const workspaceName = String(form.get("workspaceName") ?? "").trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { display_name: displayName, workspace_name: workspaceName } },
    });
    setBusy(false);
    if (error) { toast.error("Не удалось создать аккаунт", { description: error.message }); return; }
    if (!data.session) { toast.success("Проверьте почту", { description: "Мы отправили ссылку для подтверждения аккаунта." }); return; }
    await navigate({ to: "/import" });
  }

  async function googleSignIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } });
    if (result.error) { setBusy(false); toast.error("Вход через Google не выполнен", { description: result.error.message }); return; }
    if (!result.redirected) await navigate({ to: "/import" });
  }

  async function resetPassword() {
    const email = window.prompt("Введите email для восстановления доступа");
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    error ? toast.error("Не удалось отправить письмо", { description: error.message }) : toast.success("Ссылка отправлена", { description: "Проверьте вашу почту." });
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-ink px-12 py-10 text-ink-foreground lg:flex lg:flex-col xl:px-20">
        <BrandMark />
        <div className="my-auto max-w-xl py-16">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-ink-border bg-ink-soft px-3 py-1.5 text-xs font-semibold text-lime"><Sparkles className="size-3.5" />CRM, которая помнит всё</div>
          <h1 className="font-display text-5xl font-bold leading-[1.04] xl:text-6xl">Клиенты, собаки и расписание — <span className="text-lime">по своим местам.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-muted">Собрано помогает кинологам и небольшим студиям работать спокойнее, а расти — увереннее.</p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            {["Умное расписание", "Пакеты и оплаты", "Онлайн-запись", "Импорт за минуту"].map((item) => <div key={item} className="flex items-center gap-2 text-sm text-ink-muted"><span className="grid size-5 place-items-center rounded-full bg-lime/15 text-lime"><Check className="size-3" /></span>{item}</div>)}
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-ink-muted"><ShieldCheck className="size-4 text-lime" />Ваши данные защищены и доступны только вам</p>
        <div className="pointer-events-none absolute -bottom-36 -right-36 size-[430px] rounded-full border-[70px] border-lime/5" />
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 md:px-10">
        <div className="w-full max-w-md">
          <div className="mb-9 lg:hidden"><BrandMark /></div>
          <div className="mb-7"><p className="mb-2 text-sm font-semibold text-primary">Добро пожаловать</p><h2 className="font-display text-3xl font-bold">Ваше рабочее пространство</h2><p className="mt-2 text-sm text-muted-foreground">Войдите или создайте аккаунт за пару минут.</p></div>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="grid h-12 w-full grid-cols-2 rounded-lg"><TabsTrigger value="login" className="h-10">Войти</TabsTrigger><TabsTrigger value="signup" className="h-10">Создать аккаунт</TabsTrigger></TabsList>
            <TabsContent value={mode} className="mt-6">
              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="displayName">Ваше имя</Label><Input id="displayName" name="displayName" placeholder="Анна" required className="h-11" /></div><div className="space-y-2"><Label htmlFor="workspaceName">Название команды</Label><Input id="workspaceName" name="workspaceName" placeholder="Хвостатая команда" required className="h-11" /></div></div>}
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com" required className="h-11" /></div>
                <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Пароль</Label>{mode === "login" && <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={resetPassword}>Забыли пароль?</Button>}</div><div className="relative"><Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required className="h-11 pr-11" /><Button type="button" variant="ghost" size="icon" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} className="absolute right-1 top-1 size-9" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></div>
                <Button type="submit" size="lg" className="h-12 w-full" disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}{mode === "login" ? "Войти в Собрано" : "Создать рабочее пространство"}</Button>
              </form>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">или</div>
              <Button type="button" variant="outline" size="lg" className="h-12 w-full" onClick={googleSignIn} disabled={busy}><span className="text-base font-bold text-google">G</span>Продолжить с Google</Button>
              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">Продолжая, вы принимаете условия сервиса и политику конфиденциальности.</p>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
}