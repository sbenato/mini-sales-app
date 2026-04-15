"use client";

import { useState } from "react";
import { API_URL } from "../types";
import styles from "./ScoreSelector.module.css";

interface Props {
  saleId: number;
  currentScore: number | null;
  onEvaluated: () => void;
}

export default function ScoreSelector({ saleId, currentScore, onEvaluated }: Props) {
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

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

  const activeScore = hovered ?? currentScore;

  return (
    <div className={styles.container} onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          className={`${styles.star} ${activeScore !== null && score <= activeScore ? styles.active : ""}`}
          onClick={() => handleScore(score)}
          onMouseEnter={() => setHovered(score)}
          disabled={loading}
          title={`Score ${score}`}
          aria-label={`Evaluar con score ${score}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
