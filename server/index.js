import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import searchRoutes from "./routes/search.js";
import priceRoutes from "./routes/prices.js";
import importRoutes from "./routes/import.js";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Health ──
app.get("/api/health", (req, res) => {
  const services = {
    ebay: !!(process.env.EBAY_APP_ID && process.env.EBAY_APP_ID !== "your_ebay_app_id"),
    etsy: !!(process.env.ETSY_API_KEY && process.env.ETSY_API_KEY !== "your_etsy_api_key"),
  };
  res.json({ status: "ok", services, timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use("/api/search", searchRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/import", importRoutes);

// ── Serve static frontend in production ──
const distPath = join(__dirname, "..", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback (Express v5 syntax)
  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(join(distPath, "index.html"));
  });
  console.log(`   Static: serving from ${distPath}`);
}

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`\n⚡ FlipFlow Pro running on http://localhost:${PORT}`);
  console.log(`   eBay API: ${process.env.EBAY_APP_ID && process.env.EBAY_APP_ID !== "your_ebay_app_id" ? "✓ configured" : "✗ missing EBAY_APP_ID"}`);
  console.log(`   Etsy API: ${process.env.ETSY_API_KEY && process.env.ETSY_API_KEY !== "your_etsy_api_key" ? "✓ configured" : "✗ missing ETSY_API_KEY"}`);
  console.log(`   Mode: ${process.env.NODE_ENV || "development"}\n`);
});

export default app;
