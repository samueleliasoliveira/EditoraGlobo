import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ProductRankingItem } from "@/types";

type Props = {
  items: ProductRankingItem[];
  title?: string;
};

const medal: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-700 border-yellow-300",
  2: "bg-slate-100 text-slate-700 border-slate-300",
  3: "bg-orange-100 text-orange-700 border-orange-300",
};

export function ProductRankingTable({ items, title = "Produtos Mais Vendidos" }: Props) {
  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
        <p>Nenhum dado recebido ainda. Aguarde a sincronização do agente.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">{items.length} produtos</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium w-16">Posição</th>
              <th className="px-4 py-2.5 text-left font-medium">Produto</th>
              <th className="px-4 py-2.5 text-right font-medium">Qtd.</th>
              <th className="px-4 py-2.5 text-right font-medium">Faturamento</th>
              <th className="px-4 py-2.5 text-right font-medium hidden sm:table-cell">Preço Médio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => {
              const avgPrice = p.quantity > 0 ? p.revenue / p.quantity : 0;
              return (
                <tr key={`${p.productId}-${p.rank}`} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${medal[p.rank] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
                      {p.rank}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{p.productName}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatNumber(p.quantity)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{formatCurrency(p.revenue)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 hidden sm:table-cell">{formatCurrency(avgPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
