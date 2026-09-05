"use client";

import { differenceInSeconds, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Props = {
  generatedAt: string | null;
  refreshedAt: Date;
};

export function LastUpdateBadge({ generatedAt, refreshedAt }: Props) {
  if (!generatedAt) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        Aguardando primeira sincronização
      </div>
    );
  }

  const gen = new Date(generatedAt);
  const ageSec = Math.max(0, differenceInSeconds(refreshedAt, gen));
  const stale = ageSec > 120;

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-sm",
      stale
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-emerald-200 bg-emerald-50 text-emerald-800",
    )}>
      <span className={cn("h-2 w-2 rounded-full", stale ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
      <span className="font-medium">Última atualização: {format(gen, "dd/MM HH:mm:ss", { locale: ptBR })}</span>
      {stale ? (
        <span className="ml-1 font-semibold">
          Dados sem atualização há {Math.floor(ageSec / 60)}min.
        </span>
      ) : (
        <span className="text-[11px] opacity-80">há {ageSec}s</span>
      )}
    </div>
  );
}
