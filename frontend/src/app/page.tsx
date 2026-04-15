"use client";

import { useCallback, useEffect, useState } from "react";
import SaleForm from "./components/SaleForm";
import SalesTable from "./components/SalesTable";

interface Sale {
  id: number;
  customer: string;
  product: string;
  amount: number;
  score: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Home() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/sales`);
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Mini Sales App
      </h1>
      <SaleForm onCreated={fetchSales} />
      <SalesTable sales={sales} loading={loading} onEvaluated={fetchSales} />
    </main>
  );
}
