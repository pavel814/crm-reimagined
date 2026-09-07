import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, setHours, setMinutes, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, LoaderCircle, MapPin, PawPrint, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Service = { id: string; owner_id: string; name: string; description: string | null; duration_minutes: number; price: number; specialist_name: string; location: string };
const slots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"];

export const Route = createFileRoute("/book")({
  head: () => ({ meta: [{ title: "Онлайн-запись — Хвостатая команда" }, { name: "description", content: "Выберите услугу, удобную дату и запишитесь на занятие онлайн." }, { property: "og:title", content: "Онлайн-запись — Хвостатая команда" }, { property: "og:description", content: "Запись на занятия в удобное время за несколько шагов." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: BookingPage,
});

function BookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => { void supabase.from("services").select("id, owner_id, name, description, duration_minutes, price, specialist_name, location").eq("is_public", true).order("created_at").then(({ data }) => { const list = data ?? []; setServices(list); if (list[0]) setServiceId(list[0].id); }); }, []);
  const service = services.find((item) => item.id === serviceId);
  const chosen = useMemo(() => date && time ? setMinutes(setHours(startOfDay(date), Number(time.split(":")[0])), Number(time.split(":")[1])) : undefined, [date, time]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!service || !chosen) return;
    const form = new FormData(event.currentTarget); setBusy(true);
    const { error } = await supabase.from("bookings").insert({ owner_id: service.owner_id, service_id: service.id, starts_at: chosen.toISOString(), customer_name: String(form.get("name") ?? "").trim(), customer_email: String(form.get("email") ?? "").trim(), customer_phone: String(form.get("phone") ?? "").trim() || null, pet_name: String(form.get("pet") ?? "").trim(), comment: String(form.get("comment") ?? "").trim() || null });
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "Это время уже занято" : "Не удалось создать запись", { description: error.code === "23505" ? "Выберите другой свободный слот." : error.message }); return; }
    setComplete(true);
  }

  if (complete) return <main className="flex min-h-screen items-center justify-center bg-soft px-5"><div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-panel"><div className="mx-auto grid size-16 place-items-center rounded-full bg-success/10 text-success"><CheckCircle2 className="size-8" /></div><h1 className="mt-6 font-display text-3xl font-bold">Вы записаны!</h1><p className="mt-2 text-muted-foreground">{service?.name} · {chosen && format(chosen, "d MMMM, HH:mm", { locale: ru })}</p><div className="mx-auto mt-6 max-w-sm rounded-lg bg-soft p-4 text-left text-sm"><p className="font-semibold">Хвостатая команда</p><p className="mt-1 text-muted-foreground">{service?.location} · {service?.specialist_name}</p></div><Button className="mt-7" onClick={() => { setComplete(false); setStep(1); setDate(undefined); setTime(""); }}>Записаться ещё</Button></div></main>;

  return <main className="min-h-screen bg-soft">
    <header className="border-b bg-background"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6"><BrandMark /><span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><ShieldCheck className="size-4 text-success" />Безопасная онлайн-запись</span></div></header>
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Онлайн-запись</p><h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Хвостатая команда</h1><p className="mt-2 text-muted-foreground">Выберите занятие и удобное время. Подтверждение займёт меньше минуты.</p></div>
      <div className="mb-6 grid grid-cols-3 gap-2 md:max-w-2xl">{["Услуга и время", "Ваши контакты", "Подтверждение"].map((label, index) => <div key={label} className="flex items-center gap-2"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${step > index + 1 ? "bg-success text-success-foreground" : step === index + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step > index + 1 ? <Check className="size-4" /> : index + 1}</span><span className="hidden text-xs font-semibold md:block">{label}</span></div>)}</div>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl border bg-card p-5 shadow-panel md:p-7">
          {step === 1 ? <div className="space-y-7"><div className="space-y-2"><Label>Услуга</Label><Select value={serviceId} onValueChange={setServiceId}><SelectTrigger className="h-12"><SelectValue placeholder="Выберите услугу" /></SelectTrigger><SelectContent>{services.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {item.price} BYN</SelectItem>)}</SelectContent></Select>{services.length === 0 && <p className="text-sm text-muted-foreground">Пока нет услуг, доступных для онлайн-записи.</p>}</div><div className="grid gap-6 md:grid-cols-[auto_1fr]"><Calendar mode="single" selected={date} onSelect={(value) => { setDate(value); setTime(""); }} disabled={(day) => day < startOfDay(new Date()) || day > addDays(new Date(), 45)} locale={ru} className="pointer-events-auto rounded-lg border" /><div><Label>Свободное время</Label><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">{slots.map((slot) => <Button key={slot} type="button" variant={time === slot ? "default" : "outline"} onClick={() => setTime(slot)} disabled={!date}><Clock3 />{slot}</Button>)}</div></div></div><Button size="lg" className="ml-auto h-11" disabled={!service || !date || !time} onClick={() => setStep(2)}>Продолжить<ArrowRight /></Button></div> : <form onSubmit={submit} className="space-y-5"><div><h2 className="font-display text-xl font-bold">Контактные данные</h2><p className="mt-1 text-sm text-muted-foreground">Чтобы мы могли подтвердить запись и связаться с вами.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">Ваше имя</Label><Input id="name" name="name" required className="h-11" /></div><div className="space-y-2"><Label htmlFor="pet">Кличка питомца</Label><Input id="pet" name="pet" required className="h-11" /></div><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="h-11" /></div><div className="space-y-2"><Label htmlFor="phone">Телефон</Label><Input id="phone" name="phone" type="tel" placeholder="+375 29 000-00-00" className="h-11" /></div></div><div className="space-y-2"><Label htmlFor="comment">Комментарий</Label><Textarea id="comment" name="comment" placeholder="Расскажите, с чем хотите поработать" className="min-h-28" /></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button type="button" variant="outline" className="h-11" onClick={() => setStep(1)}><ArrowLeft />Назад</Button><Button type="submit" className="h-11" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Check />}Подтвердить запись</Button></div></form>}
        </section>
        <aside className="space-y-4"><div className="rounded-xl bg-ink p-5 text-ink-foreground shadow-panel"><p className="text-xs font-bold uppercase tracking-[0.14em] text-lime">Ваша запись</p>{service ? <><h2 className="mt-3 font-display text-xl font-bold">{service.name}</h2><p className="mt-2 text-sm leading-relaxed text-ink-muted">{service.description}</p><div className="mt-5 space-y-3 border-t border-ink-border pt-5 text-sm"><p className="flex items-center gap-3"><Clock3 className="size-4 text-lime" />{service.duration_minutes} минут</p><p className="flex items-center gap-3"><UserRound className="size-4 text-lime" />{service.specialist_name}</p><p className="flex items-center gap-3"><MapPin className="size-4 text-lime" />{service.location}</p><p className="flex items-center gap-3"><CalendarDays className="size-4 text-lime" />{chosen ? format(chosen, "d MMMM, HH:mm", { locale: ru }) : "Дата и время не выбраны"}</p></div><div className="mt-5 flex items-end justify-between border-t border-ink-border pt-5"><span className="text-sm text-ink-muted">Стоимость</span><strong className="text-2xl">{service.price} BYN</strong></div></> : <div className="mt-6 text-sm text-ink-muted">Услуга пока не выбрана</div>}</div><div className="rounded-xl border bg-card p-5"><div className="flex gap-3"><PawPrint className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">Есть вопрос?</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Оставьте комментарий к записи — специалист ответит до занятия.</p></div></div></div></aside>
      </div>
    </div>
  </main>;
}