// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require ("path")
const letterRoutes = require("./routes/letters.routes");

const app = express();// Serve generated PDFs
app.use("/downloads", express.static(path.join(__dirname, "storage/pdfs")));
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// Serve generated PDFs
app.use("/downloads", express.static(path.join(__dirname, "storage/pdfs")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/letters", letterRoutes);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});