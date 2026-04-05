// ─── API Client ───
// Connects frontend to the FlipFlow backend

const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(data.error || `API Error ${res.status}`);
  }

  return res.json();
}

/** Check which API services are available */
export async function getApiStatus() {
  try {
    return await request("/api/search/status");
  } catch {
    return { ebay: false, etsy: false, manual: true, offline: true };
  }
}

/** Health check */
export async function healthCheck() {
  try {
    return await request("/api/health");
  } catch {
    return { status: "offline" };
  }
}

/** Multi-platform search */
export async function searchListings({ keywords, categories, platforms, minPrice, maxPrice, sellerTypes, config }) {
  return request("/api/search", {
    method: "POST",
    body: JSON.stringify({ keywords, categories, platforms, minPrice, maxPrice, sellerTypes, config }),
  });
}

/** Get market price for a query */
export async function getMarketPrice(query) {
  return request(`/api/prices?q=${encodeURIComponent(query)}`);
}

/** Get market prices for multiple queries */
export async function getMarketPrices(queries) {
  return request("/api/prices/batch", {
    method: "POST",
    body: JSON.stringify({ queries }),
  });
}

/** Import manually captured listings */
export async function importManualListings(listings, config = {}) {
  return request("/api/import/manual", {
    method: "POST",
    body: JSON.stringify({ listings, config }),
  });
}

/** Import CSV data */
export async function importCsvListings(csv, config = {}) {
  return request("/api/import/csv", {
    method: "POST",
    body: JSON.stringify({ csv, config }),
  });
}
