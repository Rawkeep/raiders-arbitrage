import { Router } from "express";
import { getEbaySoldPrices } from "../services/ebay.js";

const router = Router();

/**
 * GET /api/prices?q=iPhone+14+Pro
 * Get market price data for a product query
 */
router.get("/", async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Query parameter 'q' required" });

    const data = await getEbaySoldPrices({ query, limit: 30 });

    res.json({
      query,
      ...data,
      source: "ebay_active_listings",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/prices/batch
 * Get market prices for multiple queries at once
 */
router.post("/batch", async (req, res, next) => {
  try {
    const { queries = [] } = req.body;
    if (queries.length === 0) return res.status(400).json({ error: "queries array required" });

    const results = {};
    await Promise.all(
      queries.slice(0, 20).map(q =>
        getEbaySoldPrices({ query: q, limit: 20 })
          .then(data => { results[q] = data; })
          .catch(() => { results[q] = { avg: 0, median: 0, min: 0, max: 0, count: 0 }; })
      )
    );

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
