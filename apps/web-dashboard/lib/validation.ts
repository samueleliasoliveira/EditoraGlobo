import { z } from "zod";

export const SummarySchema = z.object({
  totalSold: z.number().nonnegative(),
  ordersCount: z.number().int().nonnegative(),
  itemsCount: z.number().int().nonnegative(),
  averageTicket: z.number().nonnegative(),
});

export const ProductRankingSchema = z.object({
  rank: z.number().int().positive(),
  productId: z.string().max(100),
  productName: z.string().max(255),
  quantity: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

export const SyncPayloadSchema = z.object({
  eventId: z.string().max(80),
  generatedAt: z.coerce.date(),
  summary: SummarySchema,
  productRanking: z.array(ProductRankingSchema).max(100),
});

export type SyncPayloadInput = z.input<typeof SyncPayloadSchema>;
