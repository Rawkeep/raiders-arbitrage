// ─── Etsy Open API v3 Integration ───
// Docs: https://developers.etsy.com/documentation/reference

/**
 * Search active Etsy listings
 */
export async function searchEtsy({ query, minPrice, maxPrice, category, limit = 50, offset = 0 }) {
  const apiKey = process.env.ETSY_API_KEY;
  if (!apiKey) throw new Error("Etsy API key not configured");

  const params = new URLSearchParams({
    keywords: query,
    limit: String(Math.min(limit, 100)),
    offset: String(offset),
    sort_on: "score",
  });

  if (minPrice) params.set("min_price", String(minPrice));
  if (maxPrice) params.set("max_price", String(maxPrice));
  if (category) params.set("taxonomy_id", category);

  const url = `https://openapi.etsy.com/v3/application/listings/active?${params}`;

  const res = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Etsy search failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const items = (data.results || []).map(normalizeEtsyItem);

  return {
    platform: "etsy",
    total: data.count || 0,
    items,
    hasMore: (offset + items.length) < (data.count || 0),
  };
}

/**
 * Get listing images (separate API call on Etsy)
 */
export async function getEtsyListingImages(listingId) {
  const apiKey = process.env.ETSY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://openapi.etsy.com/v3/application/listings/${listingId}/images`,
      { headers: { "x-api-key": apiKey } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(img => img.url_570xN || img.url_fullxfull || "");
  } catch {
    return [];
  }
}

function normalizeEtsyItem(item) {
  const price = parseFloat(item.price?.amount || 0) / (item.price?.divisor || 100);

  let condition = "gut";
  if (item.is_vintage) condition = "akzeptabel";
  if (item.when_made === "made_to_order" || item.when_made === "2020_2024") condition = "neu";

  return {
    id: `ET-${item.listing_id}`,
    externalId: String(item.listing_id),
    title: item.title || "",
    price,
    currency: item.price?.currency_code || "EUR",
    condition,
    platform: "etsy",
    location: item.shop_section_id ? "" : "",
    seller: {
      name: `shop_${item.shop_id}`,
      rating: 0,
      sales: item.num_favorers || 0,
      badge: item.is_vintage ? "Vintage" : null,
    },
    sellerType: "commercial",
    images: item.images?.length || 0,
    imageUrl: item.images?.[0]?.url_570xN || null,
    itemUrl: item.url || `https://www.etsy.com/listing/${item.listing_id}`,
    posted: item.created_timestamp ? new Date(item.created_timestamp * 1000).toISOString() : null,
    description: (item.description || "").slice(0, 300),
    category: item.taxonomy_path?.join(" > ") || "",
    tags: item.tags || [],
    views: item.views || 0,
    favorites: item.num_favorers || 0,
    // Will be enriched
    marketValue: null,
    margin: null,
    aiScore: null,
    status: "new",
    negotiable: false,
    urgency: "low",
    matchKeywords: [],
    bestResalePlatform: null,
    bestResaleNet: null,
  };
}

export const ETSY_CATEGORIES = {
  "Elektronik": "112",
  "Möbel": "891",
  "Mode & Accessoires": "69150433",
  "Sammlerstücke": "69197435",
  "Spielzeug & Games": "69197457",
  "Haushaltsgeräte": "891",
  "Bücher & Medien": "69150367",
  "Garten & Heimwerk": "69150383",
  "Musikinstrumente": "69150427",
  "Baby & Kind": "69150365",
  "Antiquitäten": "69197435",
};
