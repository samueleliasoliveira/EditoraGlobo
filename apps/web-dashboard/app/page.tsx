import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/DashboardView";
import { signOut } from "@/app/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return redirect("/login");

  const { data: events } = await supabase
    .from("events")
    .select("id, name, slug, status")
    .order("created_at", { ascending: false })
    .limit(10);

  const defaultEvent = events?.[0] ?? null;

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
                {defaultEvent?.name ?? "Selecione um evento"} ·{" "}
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {defaultEvent?.status ?? "N/A"}
                </span>
              </p>
            </div>
          </div>
          <form action={signOut}>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              {auth.user.email} · Sair
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
