import { Router } from "express";
import { searchEbay, EBAY_CATEGORIES_DE } from "../services/ebay.js";
import { searchEtsy, ETSY_CATEGORIES } from "../services/etsy.js";
import { scoreListings } from "../services/scoring.js";
import { getEbaySoldPrices } from "../services/ebay.js";

const router = Router();

/**
 * POST /api/search
 * Multi-platform search endpoint
 * Body: { keywords, categories, platforms, minPrice, maxPrice, sellerTypes, config }
 */
router.post("/", async (req, res, next) => {
  try {
    const { keywords = [], categories = [], platforms = [], minPrice, maxPrice, config = {} } = req.body;

    if (keywords.length === 0 && categories.length === 0) {
      return res.status(400).json({ error: "Mindestens ein Keyword oder eine Kategorie nötig" });
    }

    const queries = keywords.length > 0 ? keywords : categories;
    const allItems = [];
    const errors = [];

    // ── Search each platform in parallel ──
    const searchPromises = [];

    for (const query of queries) {
      // eBay
      if (platforms.includes("ebay")) {
        const catId = categories[0] ? EBAY_CATEGORIES_DE[categories[0]] : undefined;
        searchPromises.push(
          searchEbay({ query, category: catId, minPrice, maxPrice, limit: 50 })
            .then(r => allItems.push(...r.items))
            .catch(e => errors.push({ platform: "ebay", error: e.message }))
        );
      }

      // Etsy
      if (platforms.includes("etsy")) {
        const catId = categories[0] ? ETSY_CATEGORIES[categories[0]] : undefined;
        searchPromises.push(
          searchEtsy({ query, category: catId, minPrice, maxPrice, limit: 50 })
            .then(r => allItems.push(...r.items))
            .catch(e => errors.push({ platform: "etsy", error: e.message }))
        );
      }
    }

    await Promise.all(searchPromises);

    // ── Deduplicate by title similarity ──
    const seen = new Set();
    const unique = allItems.filter(item => {
      const key = item.title.toLowerCase().replace(/\s+/g, "").slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ── Get market prices for scoring ──
    const marketDataMap = {};
    const priceQueries = [...new Set(queries)].slice(0, 5); // limit price lookups

    await Promise.all(
      priceQueries.map(q =>
        getEbaySoldPrices({ query: q, limit: 30 })
          .then(data => { marketDataMap[q.toLowerCase().slice(0, 30)] = data; })
          .catch(() => {})
      )
    );

    // ── Score all listings ──
    const scored = scoreListings(unique, marketDataMap, config);

    res.json({
      total: scored.length,
      items: scored,
      errors: errors.length > 0 ? errors : undefined,
      platforms: {
        ebay: platforms.includes("ebay"),
        etsy: platforms.includes("etsy"),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search/status
 * Check which APIs are available
 */
router.get("/status", (req, res) => {
  res.json({
    ebay: !!(process.env.EBAY_APP_ID && process.env.EBAY_APP_ID !== "your_ebay_app_id"),
    etsy: !!(process.env.ETSY_API_KEY && process.env.ETSY_API_KEY !== "your_etsy_api_key"),
    manual: true, // always available
  });
});

export default router;
