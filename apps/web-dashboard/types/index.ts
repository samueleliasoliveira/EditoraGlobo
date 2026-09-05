export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          name: string;
          slug: string;
          api_token: string;
          status: string;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      consolidated_snapshots: {
        Row: {
          id: string;
          event_id: string;
          generated_at: string;
          total_sold: number;
          orders_count: number;
          items_count: number;
          average_ticket: number;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      product_rankings: {
        Row: {
          id: string;
          snapshot_id: string;
          rank: number;
          product_id: string;
          product_name: string;
          quantity: number;
          revenue: number;
        };
        Insert: any;
        Update: any;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export type Summary = {
  totalSold: number;
  ordersCount: number;
  itemsCount: number;
  averageTicket: number;
};

export type ProductRankingItem = {
  rank: number;
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
};

export type SyncPayload = {
  eventId: string;
  generatedAt: string;
  summary: Summary;
  productRanking: ProductRankingItem[];
};
