"use client";

import { useEffect, useState, useCallback } from "react";
import { StatCard } from "@/components/StatCard";
import { ProductRankingTable } from "@/components/ProductRankingTable";
import { LastUpdateBadge } from "@/components/LastUpdateBadge";
import type { ProductRankingItem, Summary } from "@/types";
import { DollarSign, ShoppingCart, Package, Ticket } from "lucide-react";

type Props = { initialEventSlug: string | null };

type Snapshot = {
  id: string;
  event_id: string;
  generated_at: string;
  total_sold: number;
  orders_count: number;
  items_count: number;
  average_ticket: number;
};

type Api = {
  event: { id: string; name: string; slug: string } | null;
  snapshot: Snapshot | null;
  ranking: ProductRankingItem[];
  refreshedAt: string;
};

const EMPTY_SUMMARY: Summary = {
  totalSold: 0, ordersCount: 0, itemsCount: 0, averageTicket: 0,
};

export function DashboardView({ initialEventSlug }: Props) {
  const [slug, setSlug] = useState<string | null>(initialEventSlug);
  const [data, setData] = useState<Api | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard-data${slug ? `?event=${encodeURIComponent(slug)}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: Api = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar");
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setInterval(() => { fetchData(); }, 30_000);
    return () => clearInterval(t);
  }, [fetchData]);

  const summary: Summary = data?.snapshot
    ? {
        totalSold: data.snapshot.total_sold,
        ordersCount: data.snapshot.orders_count,
        itemsCount: data.snapshot.items_count,
        averageTicket: data.snapshot.average_ticket,
      }
    : EMPTY_SUMMARY;

  const refreshedAt = data?.refreshedAt ? new Date(data.refreshedAt) : new Date();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LastUpdateBadge generatedAt={data?.snapshot?.generated_at ?? null} refreshedAt={refreshedAt} />
          {error ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {error}
            </span>
          ) : null}
        </div>
        <button
          onClick={() => fetchData()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          Atualizar agora
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Vendido" value={summary.totalSold} format="currency" accent="green" icon={<DollarSign size={22} />} />
        <StatCard label="Pedidos" value={summary.ordersCount} format="number" accent="blue" icon={<ShoppingCart size={22} />} />
        <StatCard label="Itens Vendidos" value={summary.itemsCount} format="number" accent="purple" icon={<Package size={22} />} />
        <StatCard label="Ticket Médio" value={summary.averageTicket} format="currency" accent="orange" icon={<Ticket size={22} />} />
      </section>

      <section className="grid grid-cols-1 gap-4">
        <ProductRankingTable items={data?.ranking ?? []} />
      </section>

      <footer className="pt-2 text-center text-xs text-slate-400">
        Atualização automática a cada 30 segundos · {data?.event?.name ?? "Evento: não definido"}
      </footer>
    </div>
  );
}
