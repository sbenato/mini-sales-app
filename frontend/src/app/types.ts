export interface Sale {
  id: number;
  customer: string;
  product: string;
  amount: number;
  score: number | null;
  created_at: string;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
