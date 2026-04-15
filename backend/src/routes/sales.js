const { Router } = require("express");
const db = require("../db");

const router = Router();

// GET /api/sales
router.get("/", (req, res) => {
  const sales = db.prepare("SELECT * FROM sales ORDER BY id DESC").all();
  res.json(sales);
});

// POST /api/sales
router.post("/", (req, res) => {
  const { customer, product, amount } = req.body;

  if (!customer || !customer.trim()) {
    return res.status(400).json({ error: "customer is required" });
  }
  if (!product || !product.trim()) {
    return res.status(400).json({ error: "product is required" });
  }
  if (amount == null || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "amount must be a number greater than 0" });
  }

  const stmt = db.prepare(
    "INSERT INTO sales (customer, product, amount) VALUES (?, ?, ?)"
  );
  const result = stmt.run(customer.trim(), product.trim(), Number(amount));

  const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(sale);
});

// POST /api/sales/:id/evaluate
router.post("/:id/evaluate", (req, res) => {
  const { id } = req.params;
  const { score } = req.body;

  if (score == null || !Number.isInteger(Number(score)) || Number(score) < 1 || Number(score) > 5) {
    return res.status(400).json({ error: "score must be an integer between 1 and 5" });
  }

  const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
  if (!sale) {
    return res.status(404).json({ error: "sale not found" });
  }

  db.prepare("UPDATE sales SET score = ? WHERE id = ?").run(Number(score), id);

  const updated = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
  res.json(updated);
});

module.exports = router;
