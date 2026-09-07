import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Новый пароль — Собрано CRM" }, { name: "description", content: "Установите новый пароль для аккаунта Собрано CRM." }, { property: "og:title", content: "Новый пароль — Собрано CRM" }, { property: "og:description", content: "Безопасное восстановление доступа к Собрано CRM." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const recovery = typeof window !== "undefined" && (window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery"));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    if (password !== confirmation) return toast.error("Пароли не совпадают");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error("Не удалось изменить пароль", { description: error.message });
    toast.success("Пароль обновлён");
    await navigate({ to: "/import" });
  }
  return <main className="flex min-h-screen items-center justify-center bg-soft px-5"><div className="w-full max-w-md rounded-xl border bg-card p-7 shadow-panel"><BrandMark /><div className="mt-8 grid size-12 place-items-center rounded-xl bg-primary-soft text-primary"><CheckCircle2 /></div><h1 className="mt-5 font-display text-3xl font-bold">Придумайте новый пароль</h1><p className="mt-2 text-sm text-muted-foreground">Минимум 8 символов. После сохранения вы вернётесь в CRM.</p>{!recovery && <p className="mt-4 rounded-md bg-warning/10 p-3 text-sm text-warning">Откройте эту страницу по ссылке из письма восстановления.</p>}<form className="mt-6 space-y-4" onSubmit={submit}><div className="space-y-2"><Label htmlFor="password">Новый пароль</Label><Input id="password" name="password" type="password" minLength={8} required className="h-11" /></div><div className="space-y-2"><Label htmlFor="confirmation">Повторите пароль</Label><Input id="confirmation" name="confirmation" type="password" minLength={8} required className="h-11" /></div><Button className="h-11 w-full" disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}Сохранить пароль</Button></form></div></main>;
}