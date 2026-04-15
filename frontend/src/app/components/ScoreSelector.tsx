"use client";

import { useState } from "react";
import styles from "./ScoreSelector.module.css";

interface Props {
  saleId: number;
  currentScore: number | null;
  onEvaluated: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ScoreSelector({ saleId, currentScore, onEvaluated }: Props) {
  const [loading, setLoading] = useState(false);

  const handleScore = async (score: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sales/${saleId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al evaluar");
      }

      onEvaluated();
    } catch (err) {
      console.error("Error evaluating sale:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          className={`${styles.star} ${currentScore !== null && score <= currentScore ? styles.active : ""}`}
          onClick={() => handleScore(score)}
          disabled={loading}
          title={`Score ${score}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
