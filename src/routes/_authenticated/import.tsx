import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, ChevronRight, FileSpreadsheet, History, LoaderCircle, UploadCloud, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type ParsedRow = Record<string, string>;
type ImportJob = { id: string; filename: string; status: string; total_rows: number; imported_rows: number; duplicate_rows: number; error_rows: number; created_at: string };

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({ meta: [{ title: "Импорт клиентов — Собрано CRM" }, { name: "description", content: "Проверьте и импортируйте клиентов из Excel или CSV в Собрано CRM." }, { property: "og:title", content: "Импорт клиентов — Собрано CRM" }, { property: "og:description", content: "Безопасный импорт клиентской базы с проверкой дублей." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ImportPage,
});

function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ name: "", phone: "", email: "", pet: "" });
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => { void loadJobs(); }, []);
  async function loadJobs() {
    const { data } = await supabase.from("import_jobs").select("id, filename, status, total_rows, imported_rows, duplicate_rows, error_rows, created_at").order("created_at", { ascending: false }).limit(8);
    setJobs(data ?? []);
  }

  function autoMap(headers: string[]) {
    const find = (terms: string[]) => headers.find((header) => terms.some((term) => header.toLowerCase().includes(term))) ?? "";
    setMapping({ name: find(["имя", "name", "клиент"]), phone: find(["телефон", "phone", "моб"]), email: find(["email", "почт", "e-mail"]), pet: find(["питом", "собак", "pet", "клич"]), });
  }

  async function chooseFile(selected?: File) {
    if (!selected) return;
    if (!/\.(csv|xlsx|xls)$/i.test(selected.name)) { toast.error("Выберите файл CSV, XLS или XLSX"); return; }
    setChecking(true);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await selected.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) throw new Error("В файле нет листов");
      const sheet = workbook.Sheets[firstSheet];
      if (!sheet) throw new Error("Не удалось прочитать лист");
      const parsed = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: "", raw: false });
      const headers = parsed[0] ? Object.keys(parsed[0]) : [];
      setFile(selected); setRows(parsed); setColumns(headers); autoMap(headers);
      toast.success(`Файл прочитан: ${parsed.length} строк`);
    } catch (error) { toast.error("Не удалось прочитать файл", { description: error instanceof Error ? error.message : "Проверьте формат файла" }); }
    finally { setChecking(false); }
  }

  const validRows = useMemo(() => rows.filter((row) => mapping.name && String(row[mapping.name] ?? "").trim()), [rows, mapping.name]);

  async function importClients() {
    if (!file || !mapping.name) { toast.error("Выберите колонку с именем"); return; }
    setImporting(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { setImporting(false); toast.error("Сессия завершилась. Войдите снова."); return; }
    const normalized = validRows.map((row) => ({ owner_id: user.id, name: String(row[mapping.name] ?? "").trim(), phone: mapping.phone ? String(row[mapping.phone] ?? "").trim() || null : null, email: mapping.email ? String(row[mapping.email] ?? "").trim().toLowerCase() || null : null, pet_name: mapping.pet ? String(row[mapping.pet] ?? "").trim() || null : null, source: "import" }));
    const { data: existing } = await supabase.from("clients").select("email, phone");
    const duplicate = normalized.filter((row) => (row.email && existing?.some((item) => item.email === row.email)) || (row.phone && existing?.some((item) => item.phone === row.phone)));
    const fresh = normalized.filter((row) => !duplicate.includes(row));
    const { error } = fresh.length ? await supabase.from("clients").insert(fresh) : { error: null };
    const failed = error ? fresh.length : 0;
    await supabase.from("import_jobs").insert({ owner_id: user.id, filename: file.name, status: error ? "failed" : "completed", total_rows: rows.length, imported_rows: error ? 0 : fresh.length, duplicate_rows: duplicate.length, error_rows: rows.length - validRows.length + failed });
    setImporting(false);
    if (error) { toast.error("Импорт не завершён", { description: error.message }); return; }
    toast.success(`Добавлено клиентов: ${fresh.length}`, { description: duplicate.length ? `Пропущено дублей: ${duplicate.length}` : undefined });
    setFile(null); setRows([]); setColumns([]); setMapping({ name: "", phone: "", email: "", pet: "" }); await loadJobs();
  }

  function clearFile() { setFile(null); setRows([]); setColumns([]); setMapping({ name: "", phone: "", email: "", pet: "" }); if (inputRef.current) inputRef.current.value = ""; }

  return <AppShell><main className="mx-auto w-full max-w-7xl px-4 py-7 md:px-7">
    <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Рабочее пространство</p><h1 className="mt-1 font-display text-3xl font-bold">Импорт клиентов</h1><p className="mt-1 text-sm text-muted-foreground">Перенесите базу из таблицы — мы проверим колонки и дубли до загрузки.</p></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="space-y-5">
        <Card className="shadow-panel"><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle className="text-lg">История импортов</CardTitle><p className="mt-1 text-sm text-muted-foreground">Последние загрузки в клиентскую базу</p></div><History className="size-5 text-muted-foreground" /></CardHeader><CardContent>
          {jobs.length === 0 ? <div className="grid min-h-56 place-items-center rounded-lg border border-dashed bg-soft"><div className="text-center"><div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><UsersRound /></div><p className="mt-4 font-semibold">Импортов пока не было</p><p className="mt-1 text-sm text-muted-foreground">Первый импорт появится здесь</p></div></div> : <div className="divide-y">{jobs.map((job) => <div key={job.id} className="flex items-center gap-3 py-4"><div className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"><FileSpreadsheet className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{job.filename}</p><p className="text-xs text-muted-foreground">{new Date(job.created_at).toLocaleDateString("ru-RU")} · {job.imported_rows} добавлено · {job.duplicate_rows} дублей</p></div><Badge variant={job.status === "completed" ? "secondary" : "destructive"}>{job.status === "completed" ? "Готово" : "Ошибка"}</Badge></div>)}</div>}
        </CardContent></Card>
        <div className="rounded-xl bg-ink p-6 text-ink-foreground shadow-panel"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-lime/15 text-lime"><CheckCircle2 /></span><div><h2 className="font-display text-lg font-bold">Перед импортом всё под контролем</h2><p className="mt-1 text-sm leading-relaxed text-ink-muted">Мы не удаляем существующих клиентов. Совпадения по телефону или email будут пропущены и показаны в отчёте.</p></div></div></div>
      </section>
      <Card className="h-fit shadow-panel"><CardHeader><CardTitle className="text-xl">Excel или CSV</CardTitle><p className="text-sm text-muted-foreground">Загрузите таблицу до 10 МБ</p></CardHeader><CardContent className="space-y-5">
        <input ref={inputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(e) => void chooseFile(e.target.files?.[0])} />
        {!file ? <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void chooseFile(e.dataTransfer.files[0]); }} className="group grid w-full place-items-center rounded-lg border border-dashed border-primary/40 bg-primary-soft/40 px-5 py-10 text-center transition-colors hover:bg-primary-soft"><span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand"><UploadCloud /></span><span className="mt-4 text-sm font-semibold">Перетащите файл сюда</span><span className="mt-1 text-xs text-muted-foreground">или нажмите, чтобы выбрать</span></button> : <div className="flex items-center gap-3 rounded-lg border bg-soft p-3"><FileSpreadsheet className="size-8 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{file.name}</p><p className="text-xs text-muted-foreground">{rows.length} строк · {(file.size / 1024).toFixed(0)} КБ</p></div><Button variant="ghost" size="icon" aria-label="Удалить файл" onClick={clearFile}><X /></Button></div>}
        {checking && <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Проверяем структуру таблицы…</div>}
        {columns.length > 0 && <div className="space-y-4 border-t pt-5"><div><h3 className="text-sm font-semibold">Сопоставьте колонки</h3><p className="mt-1 text-xs text-muted-foreground">Мы уже выбрали наиболее подходящие</p></div>
          <Mapping label="Имя клиента" value={mapping.name} required columns={columns} onChange={(value) => setMapping((m) => ({ ...m, name: value }))} />
          <Mapping label="Телефон" value={mapping.phone} columns={columns} onChange={(value) => setMapping((m) => ({ ...m, phone: value === "__skip" ? "" : value }))} />
          <Mapping label="Email" value={mapping.email} columns={columns} onChange={(value) => setMapping((m) => ({ ...m, email: value === "__skip" ? "" : value }))} />
          <Mapping label="Питомец" value={mapping.pet} columns={columns} onChange={(value) => setMapping((m) => ({ ...m, pet: value === "__skip" ? "" : value }))} />
          <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-xs text-success"><CheckCircle2 className="size-4" />Готово к импорту: {validRows.length} из {rows.length}</div>
        </div>}
        <Button className="h-11 w-full" onClick={importClients} disabled={!file || !mapping.name || importing}>{importing ? <LoaderCircle className="animate-spin" /> : <UploadCloud />}Импортировать клиентов<ChevronRight /></Button>
        <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><AlertCircle className="mt-0.5 size-4 shrink-0" />Пустые строки и записи без имени не будут добавлены.</div>
      </CardContent></Card>
    </div>
  </main></AppShell>;
}

function Mapping({ label, value, columns, required = false, onChange }: { label: string; value: string; columns: string[]; required?: boolean; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label><Select value={value || "__skip"} onValueChange={onChange}><SelectTrigger className="h-10"><SelectValue placeholder="Не выбрано" /></SelectTrigger><SelectContent><SelectItem value="__skip">Не импортировать</SelectItem>{columns.map((column) => <SelectItem key={column} value={column}>{column}</SelectItem>)}</SelectContent></Select></div>;
}