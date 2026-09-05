import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "R$ 0,00";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatNumber(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "0";
  return v.toLocaleString("pt-BR");
}
