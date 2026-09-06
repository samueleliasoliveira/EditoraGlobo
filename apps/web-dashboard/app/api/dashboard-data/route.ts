import { NextResponse, type NextRequest } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database, ProductRankingItem } from "@/types";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

type SnapshotRow =
  Database["public"]["Tables"]["consolidated_snapshots"]["Row"] & {
    created_at?: string | null;
  };

type RankingRow = Database["public"]["Tables"]["product_rankings"]["Row"];

export async function GET(_req: NextRequest) {
  try {
    // 1) Valida sessao usuario autenticado via cookies.
    const supabaseUser = createUserClient();
    const { data: auth, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr) {
      if (typeof console !== "undefined") {
        console.error("[dashboard-data] auth.getUser error:", authErr.message);
      }
    }
    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(_req.url);
    const eventFilter = url.searchParams.get("event");
    const supabase = createServiceClient();

    // 2) Evento: mais novo / filtrado por slug ou id.
    let eventQ = supabase
      .from("events")
      .select("id, name, slug, status")
      .order("created_at", { ascending: false });
    if (eventFilter) eventQ = eventQ.or(`slug.eq.${eventFilter},id.eq.${eventFilter}`);
    const { data: eventsRaw, error: evErr } = await eventQ.limit(1);
    if (evErr) {
      if (typeof console !== "undefined") {
        console.error("[dashboard-data] events query error:", evErr.message);
      }
      return NextResponse.json(
        { error: "Falha ao consultar eventos" },
        { status: 500 },
      );
    }
    const events: EventRow[] = (eventsRaw ?? []) as EventRow[];
    const event: EventRow | null = events?.[0] ?? null;

    let snapshot: SnapshotRow | null = null;
    let ranking: ProductRankingItem[] = [];

    if (event) {
      // 3) Ultimo snapshot consolidado (ou null, NAO crasha se vazio).
      const { data: snapsRaw, error: snapErr } = await supabase
        .from("consolidated_snapshots")
        .select(
          "id, event_id, generated_at, total_sold, orders_count, items_count, average_ticket, created_at",
        )
        .eq("event_id", event.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (snapErr) {
        if (typeof console !== "undefined") {
          console.error(
            "[dashboard-data] consolidated_snapshots query error:",
            snapErr.message,
          );
        }
      }
      const snaps: SnapshotRow[] = (snapsRaw ?? []) as SnapshotRow[];
      snapshot = snaps?.[0] ?? null;

      if (snapshot) {
        // 4) Ranking de produtos (ou array vazio).
        const { data: rowsRaw, error: rankErr } = await supabase
          .from("product_rankings")
          .select("rank, product_id, product_name, quantity, revenue")
          .eq("snapshot_id", snapshot.id)
          .order("rank", { ascending: true });
        if (rankErr) {
          if (typeof console !== "undefined") {
            console.error(
              "[dashboard-data] product_rankings query error:",
              rankErr.message,
            );
          }
        }
        const rows: RankingRow[] = (rowsRaw ?? []) as RankingRow[];
        ranking = rows.map((r) => ({
          rank: Number(r.rank) || 0,
          productId: String(r.product_id),
          productName: String(r.product_name),
          quantity: Number(r.quantity) || 0,
          revenue: Number(r.revenue) || 0,
        }));
      }
    }

    return NextResponse.json({
      event: event ? { id: event.id, name: event.name, slug: event.slug } : null,
      snapshot: snapshot
        ? {
            id: snapshot.id,
            event_id: snapshot.event_id,
            generated_at:
              snapshot.generated_at ?? snapshot.created_at ?? new Date().toISOString(),
            total_sold: Number(snapshot.total_sold) || 0,
            orders_count: Number(snapshot.orders_count) || 0,
            items_count: Number(snapshot.items_count) || 0,
            average_ticket: Number(snapshot.average_ticket) || 0,
          }
        : null,
      ranking,
      refreshedAt: new Date().toISOString(),
    });
  } catch (topErr: any) {
    if (typeof console !== "undefined") {
      console.error(
        "[dashboard-data] GET top-level exception:",
        topErr?.message ?? String(topErr),
      );
    }
    return NextResponse.json(
      {
        error:
          "Falha temporaria ao carregar dados. Verifique SUPABASE_SECRET_KEY / SERVICE_ROLE_KEY.",
      },
      { status: 500 },
    );
  }
}
