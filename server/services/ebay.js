// ─── eBay Browse API Integration ───
// Uses Client Credentials Grant (no user auth needed)
// Docs: https://developer.ebay.com/api-docs/buy/browse/overview.html

let tokenCache = { token: null, expires: 0 };

const MARKETPLACE_MAP = {
  EBAY_DE: { siteId: "EBAY_DE", currency: "EUR", language: "de-DE" },
  EBAY_US: { siteId: "EBAY_US", currency: "USD", language: "en-US" },
  EBAY_GB: { siteId: "EBAY_GB", currency: "GBP", language: "en-GB" },
  EBAY_FR: { siteId: "EBAY_FR", currency: "EUR", language: "fr-FR" },
  EBAY_IT: { siteId: "EBAY_IT", currency: "EUR", language: "it-IT" },
  EBAY_ES: { siteId: "EBAY_ES", currency: "EUR", language: "es-ES" },
  EBAY_AU: { siteId: "EBAY_AU", currency: "AUD", language: "en-AU" },
  EBAY_AT: { siteId: "EBAY_AT", currency: "EUR", language: "de-AT" },
  EBAY_CH: { siteId: "EBAY_CH", currency: "CHF", language: "de-CH" },
  EBAY_NL: { siteId: "EBAY_NL", currency: "EUR", language: "nl-NL" },
  EBAY_BE: { siteId: "EBAY_BE", currency: "EUR", language: "nl-BE" },
};

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }

  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) throw new Error("eBay API keys not configured");

  const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay OAuth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

function getMarketplace() {
  const key = process.env.EBAY_MARKETPLACE || "EBAY_DE";
  return MARKETPLACE_MAP[key] || MARKETPLACE_MAP.EBAY_DE;
}

/**
 * Search active eBay listings
 */
export async function searchEbay({ query, category, minPrice, maxPrice, condition, limit = 50, offset = 0 }) {
  const token = await getAccessToken();
  const marketplace = getMarketplace();

  const params = new URLSearchParams({
    q: query,
    limit: String(Math.min(limit, 200)),
    offset: String(offset),
  });

  // Price filter
  const priceFilters = [];
  if (minPrice) priceFilters.push(`price:[${minPrice}..${maxPrice || ""}]`);
  else if (maxPrice) priceFilters.push(`price:[..${maxPrice}]`);
  if (priceFilters.length) params.set("filter", priceFilters.join(","));

  // Condition filter
  if (condition) {
    const condMap = { neu: "NEW", "wie-neu": "LIKE_NEW", gut: "GOOD", akzeptabel: "ACCEPTABLE" };
    if (condMap[condition]) params.set("filter", `conditionIds:{${condMap[condition]}}`);
  }

  // Category
  if (category) params.set("category_ids", category);

  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace.siteId,
      "X-EBAY-C-ENDUSERCTX": `contextualLocation=country=${marketplace.siteId.split("_")[1]}`,
      "Accept-Language": marketplace.language,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay search failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const items = (data.itemSummaries || []).map(normalizeEbayItem);

  return {
    platform: "ebay",
    total: data.total || 0,
    items,
    hasMore: (offset + items.length) < (data.total || 0),
  };
}

/**
 * Get completed/sold listings for price estimation
 */
export async function getEbaySoldPrices({ query, limit = 30 }) {
  const token = await getAccessToken();
  const marketplace = getMarketplace();

  const params = new URLSearchParams({
    q: query,
    limit: String(Math.min(limit, 200)),
    filter: "buyingOptions:{FIXED_PRICE|AUCTION}",
    sort: "-price",
  });

  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace.siteId,
      "Accept-Language": marketplace.language,
    },
  });

  if (!res.ok) return { prices: [], avg: 0, median: 0, min: 0, max: 0 };

  const data = await res.json();
  const prices = (data.itemSummaries || [])
    .map(i => parseFloat(i.price?.value || 0))
    .filter(p => p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) return { prices: [], avg: 0, median: 0, min: 0, max: 0 };

  const sum = prices.reduce((a, b) => a + b, 0);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

  return {
    prices,
    avg: Math.round(sum / prices.length),
    median: Math.round(median),
    min: Math.round(prices[0]),
    max: Math.round(prices[prices.length - 1]),
    count: prices.length,
  };
}

function normalizeEbayItem(item) {
  const price = parseFloat(item.price?.value || 0);
  const conditionRaw = (item.condition || "").toLowerCase();
  let condition = "gut";
  if (conditionRaw.includes("new") || conditionRaw.includes("neu")) condition = "neu";
  else if (conditionRaw.includes("like new") || conditionRaw.includes("wie neu")) condition = "wie-neu";
  else if (conditionRaw.includes("acceptable") || conditionRaw.includes("akzeptabel")) condition = "akzeptabel";
  else if (conditionRaw.includes("parts") || conditionRaw.includes("defekt")) condition = "defekt";

  return {
    id: `EB-${item.itemId}`,
    externalId: item.itemId,
    title: item.title || "",
    price,
    currency: item.price?.currency || "EUR",
    condition,
    platform: "ebay",
    location: item.itemLocation?.postalCode || item.itemLocation?.country || "",
    seller: {
      name: item.seller?.username || "unbekannt",
      rating: item.seller?.feedbackPercentage ? parseFloat(item.seller.feedbackPercentage) / 20 : 0,
      sales: item.seller?.feedbackScore || 0,
      badge: null,
    },
    sellerType: (item.seller?.feedbackScore || 0) > 100 ? "commercial" : "private",
    images: item.thumbnailImages?.length || (item.image ? 1 : 0),
    imageUrl: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null,
    itemUrl: item.itemWebUrl || item.itemAffiliateWebUrl || "",
    posted: item.itemCreationDate || null,
    description: item.shortDescription || "",
    category: item.categories?.[0]?.categoryName || "",
    buyingOptions: item.buyingOptions || [],
    shippingCost: item.shippingOptions?.[0]?.shippingCost?.value
      ? parseFloat(item.shippingOptions[0].shippingCost.value) : null,
    // Will be enriched later
    marketValue: null,
    margin: null,
    aiScore: null,
    status: "new",
    negotiable: (item.buyingOptions || []).includes("BEST_OFFER"),
    urgency: "low",
    matchKeywords: [],
    bestResalePlatform: null,
    bestResaleNet: null,
  };
}

export const EBAY_CATEGORIES_DE = {
  "Elektronik": "293",
  "Möbel": "11700",
  "Mode & Accessoires": "11450",
  "Auto & Fahrrad": "131090",
  "Sammlerstücke": "1",
  "Haushaltsgeräte": "20710",
  "Spielzeug & Games": "220",
  "Sport & Outdoor": "888",
  "Bücher & Medien": "267",
  "Garten & Heimwerk": "159912",
  "Musikinstrumente": "619",
  "Büro & IT": "58058",
  "Baby & Kind": "2984",
  "Antiquitäten": "20081",
};
