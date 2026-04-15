const express = require("express");
const cors = require("cors");
const salesRouter = require("./routes/sales");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use("/api/sales", salesRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
