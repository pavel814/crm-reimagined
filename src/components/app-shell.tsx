import { Link, useLocation } from "@tanstack/react-router";
import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  Package,
  Settings,
  Upload,
  UserRound,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  ["Сегодня", "/", LayoutDashboard],
  ["Календарь", "/", CalendarDays],
  ["Клиенты", "/", UserRound],
  ["Услуги", "/", WandSparkles],
  ["Пакеты", "/", Package],
  ["Финансы", "/", CircleDollarSign],
  ["Команда", "/", UsersRound],
  ["Рабочие часы", "/", Clock3],
  ["Настройки", "/", Settings],
  ["Импорт", "/import", Upload],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="hidden min-h-screen border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="px-2 py-1"><BrandMark /></div>
        <nav className="mt-8 space-y-1">
          {items.map(([label, to, Icon]) => {
            const active = label === "Импорт" && location.pathname === "/import";
            return (
              <Link key={label} to={to} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", active && "bg-sidebar-accent text-sidebar-accent-foreground before:-ml-3 before:h-5 before:w-0.5 before:rounded-full before:bg-primary")}>
                <Icon className="size-4" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold">Пилот</span><span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold text-warning">Пробный</span></div>
          <p className="mt-1 text-[11px] text-sidebar-muted">Осталось 14 дней</p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-sidebar-border"><div className="h-full w-1/4 bg-primary" /></div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/95 px-4 backdrop-blur md:px-7">
          <div className="lg:hidden"><BrandMark compact /></div>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm"><Link to="/book"><CalendarDays />Онлайн-запись</Link></Button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}