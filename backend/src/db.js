const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "sales.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    product TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    score INTEGER CHECK(score IS NULL OR (score >= 1 AND score <= 5)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
