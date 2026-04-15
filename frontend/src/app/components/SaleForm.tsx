"use client";

import { useState } from "react";
import { API_URL } from "../types";
import styles from "./SaleForm.module.css";

interface Props {
  onCreated: () => void;
}

export default function SaleForm({ onCreated }: Props) {
  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!customer.trim()) {
      setMessage({ type: "error", text: "Cliente es requerido" });
      return;
    }
    if (!product.trim()) {
      setMessage({ type: "error", text: "Producto es requerido" });
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setMessage({ type: "error", text: "Monto debe ser mayor a 0" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customer.trim(),
          product: product.trim(),
          amount: Number(amount),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear venta");
      }

      setCustomer("");
      setProduct("");
      setAmount("");
      setMessage({ type: "success", text: "Venta creada exitosamente" });
      onCreated();

      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear venta";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Nueva Venta</h2>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="customer">Cliente</label>
          <input
            id="customer"
            type="text"
            placeholder="Nombre del cliente"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="product">Producto</label>
          <input
            id="product"
            type="text"
            placeholder="Nombre del producto"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="amount">Monto</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Creando..." : "Crear Venta"}
        </button>
      </div>
    </form>
  );
}
