import { PawPrint } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-brand">
        <PawPrint className="size-5" strokeWidth={2.2} />
      </span>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-bold text-foreground">Собрано</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">CRM</div>
        </div>
      )}
    </div>
  );
}