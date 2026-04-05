// ─── AI Scoring Engine ───
// Bewertet jedes Listing nach mehreren Faktoren und berechnet einen Score 0-100.

const CONDITION_SCORES = {
  neu: 1.0,
  "wie-neu": 0.85,
  gut: 0.7,
  akzeptabel: 0.5,
  defekt: 0.2,
};

const PLATFORM_FEES = {
  kleinanzeigen: 0,
  ebay: 13,
  vinted: 5,
  facebook: 0,
  etsy: 6.5,
  rebuy: 0,
};

/**
 * Score a single listing against market data and config
 */
export function scoreListing(item, marketData, config) {
  let score = 0;

  // ── 1. Margin Score (0-35 pts) ──
  const marketValue = marketData?.avg || marketData?.median || item.marketValue || item.price * 1.3;
  const margin = marketValue > 0 ? ((marketValue - item.price) / item.price) * 100 : 0;

  if (margin >= 100) score += 35;
  else if (margin >= 50) score += 28;
  else if (margin >= 30) score += 20;
  else if (margin >= 15) score += 10;
  else if (margin > 0) score += 5;

  // ── 2. Condition Score (0-15 pts) ──
  const condScore = CONDITION_SCORES[item.condition] || 0.5;
  score += Math.round(condScore * 15);

  // ── 3. Seller Type Score (0-15 pts) ──
  if (item.sellerType === "private_clear") score += 15; // Auflösung = best deals
  else if (item.sellerType === "private") score += 10;
  else if (item.sellerType === "commercial") score += 5;

  // ── 4. Negotiability (0-5 pts) ──
  if (item.negotiable) score += 5;

  // ── 5. Keyword Match (0-10 pts) ──
  const keywords = config?.keywords || [];
  const titleLower = (item.title || "").toLowerCase();
  const matchCount = keywords.filter(k => titleLower.includes(k.toLowerCase())).length;
  score += Math.min(matchCount * 3, 10);

  // ── 6. Price-to-Market Ratio (0-10 pts) ──
  const ratio = marketValue > 0 ? item.price / marketValue : 1;
  if (ratio <= 0.3) score += 10;
  else if (ratio <= 0.5) score += 7;
  else if (ratio <= 0.7) score += 4;

  // ── 7. Urgency Bonus (0-10 pts) ──
  if (item.urgency === "high") score += 10;
  else if (item.urgency === "medium") score += 5;

  // Cap at 100
  score = Math.min(score, 100);

  // Calculate best resale platform
  let bestPlatform = null;
  let bestNet = 0;
  for (const [platform, fees] of Object.entries(PLATFORM_FEES)) {
    if (platform !== item.platform) {
      const net = marketValue * (1 - fees / 100);
      if (net > bestNet) {
        bestNet = net;
        bestPlatform = platform;
      }
    }
  }

  return {
    ...item,
    marketValue: Math.round(marketValue),
    margin: parseFloat(margin.toFixed(1)),
    aiScore: score,
    bestResalePlatform: bestPlatform,
    bestResaleNet: Math.round(bestNet),
    matchKeywords: keywords.filter(k => titleLower.includes(k.toLowerCase())),
    urgency: item.sellerType === "private_clear"
      ? (score >= 70 ? "high" : "medium")
      : (score >= 80 ? "medium" : "low"),
  };
}

/**
 * Score multiple listings, enriching with market data
 */
export function scoreListings(items, marketDataMap, config) {
  return items
    .map(item => {
      const key = extractMarketKey(item.title);
      const marketData = marketDataMap[key] || null;
      return scoreListing(item, marketData, config);
    })
    .sort((a, b) => b.aiScore - a.aiScore);
}

/**
 * Extract a simplified key from title for market data matching
 */
function extractMarketKey(title) {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 4)
    .join(" ");
}
