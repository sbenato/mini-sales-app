"use client";

import ScoreSelector from "./ScoreSelector";
import { Sale } from "../types";
import styles from "./SalesTable.module.css";

interface Props {
  sales: Sale[];
  loading: boolean;
  onEvaluated: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function SalesTable({ sales, loading, onEvaluated }: Props) {
  const scoredSales = sales.filter((s) => s.score !== null);
  const avgScore =
    scoredSales.length > 0
      ? scoredSales.reduce((sum, s) => sum + s.score!, 0) / scoredSales.length
      : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ventas</h2>
        {avgScore !== null && (
          <span className={styles.avg}>
            Promedio Score: <strong>{avgScore.toFixed(1)}</strong> ({scoredSales.length}{" "}
            evaluada{scoredSales.length !== 1 ? "s" : ""})
          </span>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando ventas...</div>
      ) : sales.length === 0 ? (
        <div className={styles.empty}>No hay ventas registradas. Crea una nueva venta para comenzar.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Monto</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.customer}</td>
                  <td>{sale.product}</td>
                  <td className={styles.amount}>{formatCurrency(sale.amount)}</td>
                  <td>
                    <ScoreSelector
                      saleId={sale.id}
                      currentScore={sale.score}
                      onEvaluated={onEvaluated}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
