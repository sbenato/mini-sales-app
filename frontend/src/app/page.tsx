"use client";

import { useCallback, useEffect, useState } from "react";
import SaleForm from "./components/SaleForm";
import SalesTable from "./components/SalesTable";
import { API_URL, Sale } from "./types";
import styles from "./page.module.css";

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
    <main className={styles.main}>
      <h1 className={styles.title}>Mini Sales App</h1>
      <SaleForm onCreated={fetchSales} />
      <SalesTable sales={sales} loading={loading} onEvaluated={fetchSales} />
    </main>
  );
}
