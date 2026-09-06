import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/DashboardView";
import { signOut } from "@/app/actions";
import type { Database } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export default async function DashboardPage() {
  let authUser: { email?: string | null } | null = null;
  let defaultEvent: EventRow | null = null;
  let fatalError: string | null = null;

  try {
    const authSupabase = createClient();
    const { data: auth, error: authErr } = await authSupabase.auth.getUser();
    if (authErr) {
      if (typeof console !== "undefined") {
        console.error("[page] auth.getUser falhou:", authErr.message);
      }
    }
    if (!auth?.user) {
      return redirect("/login");
    }
    authUser = { email: auth.user.email ?? null };

    try {
      const service = createServiceClient();
      const { data: eventsRaw, error: evErr } = await service
        .from("events")
        .select("id, name, slug, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (evErr) {
        if (typeof console !== "undefined") {
          console.error("[page] events query (service) error:", evErr.message);
        }
      } else {
        const events: EventRow[] = (eventsRaw ?? []) as EventRow[];
        defaultEvent = events?.[0] ?? null;
      }
    } catch (innerErr: any) {
      if (typeof console !== "undefined") {
        console.error(
          "[page] service client / events query lancou excecao:",
          innerErr?.message ?? String(innerErr),
        );
      }
      fatalError =
        innerErr?.message ??
        "Falha ao conectar ao banco de dados. Verifique as variáveis SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY.";
    }
  } catch (outerErr: any) {
    if (typeof console !== "undefined") {
      console.error(
        "[page] SSR falhou (auth supabase/server provavelmente falta env vars):",
        outerErr?.message ?? String(outerErr),
      );
    }
    fatalError =
      outerErr?.message ??
      "Configuração pendente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nas variáveis de ambiente.";
  }

  if (fatalError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white shadow-lg p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
              !
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Configuração pendente
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifique as variáveis de ambiente na Vercel.
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800 mb-5">
            Não foi possível carregar o dashboard agora.
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
            <li>
              ·{" "}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                NEXT_PUBLIC_SUPABASE_URL
              </code>
            </li>
            <li>
              ·{" "}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              </code>{" "}
              (ou ANON_KEY)
            </li>
            <li>
              ·{" "}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                SUPABASE_SECRET_KEY
              </code>{" "}
              (ou SERVICE_ROLE_KEY, marcada como Secret)
            </li>
            <li>
              ·{" "}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                NEXTAUTH_SECRET
              </code>
            </li>
          </ul>
          <form action={signOut}>
            <button className="w-full rounded-lg bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800">
              {authUser?.email ? `${authUser.email} · Sair` : "Voltar para login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              EV
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Dashboard de Vendas</p>
              <p className="text-xs text-slate-500">
                {(defaultEvent as EventRow | null)?.name ?? "Selecione um evento"} ·{" "}
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {(defaultEvent as EventRow | null)?.status ?? "N/A"}
                </span>
              </p>
            </div>
          </div>
          <form action={signOut}>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              {authUser?.email ?? "Sair"}
            </button>
          </form>
        </div>
      </header>
      <main className="container py-4 sm:py-6 space-y-5">
        <DashboardView initialEventSlug={defaultEvent?.slug ?? null} />
      </main>
    </div>
  );
}
