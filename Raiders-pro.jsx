import { useState, useEffect, useCallback, useMemo } from "react";

// ─── PLATFORM & ACCOUNT CONFIG ───
const PLATFORMS = {
  kleinanzeigen: { name: "Kleinanzeigen", icon: "🟢", color: "#86BC25", fees: 0, url: "kleinanzeigen.de" },
  ebay: { name: "eBay", icon: "🔴", color: "#E53238", fees: 13, url: "ebay.de" },
  vinted: { name: "Vinted", icon: "🟣", color: "#09B1BA", fees: 5, url: "vinted.de" },
  facebook: { name: "FB Marketplace", icon: "🔵", color: "#1877F2", fees: 0, url: "facebook.com/marketplace" },
  etsy: { name: "Etsy", icon: "🟠", color: "#F56400", fees: 6.5, url: "etsy.com" },
  rebuy: { name: "reBuy", icon: "⚪", color: "#00A1E0", fees: 0, url: "rebuy.de" },
};

const SELLER_TYPES = {
  commercial: { label: "Gewerblich", icon: "🏪", color: "#3B82F6", desc: "Professionelle Händler & Shops" },
  private_clear: { label: "Privat-Auflösung", icon: "📦", color: "#F59E0B", desc: "Keller/Haushaltsauflösung, Umzug" },
  private: { label: "Privat", icon: "👤", color: "#8B5CF6", desc: "Gelegentliche Privatverkäufer" },
};

const CATEGORIES = [
  "Elektronik", "Möbel", "Mode & Accessoires", "Auto & Fahrrad", "Sammlerstücke",
  "Haushaltsgeräte", "Spielzeug & Games", "Sport & Outdoor", "Bücher & Medien",
  "Garten & Heimwerk", "Musikinstrumente", "Büro & IT", "Baby & Kind", "Antiquitäten",
];

const CONDITION_MAP = {
  neu: { label: "Neu/OVP", score: 1.0, color: "#10B981" },
  "wie-neu": { label: "Wie neu", score: 0.85, color: "#34D399" },
  gut: { label: "Gut", score: 0.7, color: "#F59E0B" },
  akzeptabel: { label: "Akzeptabel", score: 0.5, color: "#F97316" },
  defekt: { label: "Defekt/Bastler", score: 0.2, color: "#EF4444" },
};

const STAGES = {
  DASHBOARD: "dashboard", ACCOUNTS: "accounts", SETUP: "setup", SEARCH: "search",
  CLASSIFY: "classify", REVIEW: "review", CONTACT: "contact",
  PURCHASE: "purchase", RESALE: "resale", ANALYTICS: "analytics",
};

const STAGE_META = {
  [STAGES.DASHBOARD]: { label: "Dashboard", icon: "⬡", color: "#e2e8f0" },
  [STAGES.ACCOUNTS]: { label: "Accounts", icon: "🔑", color: "#06B6D4" },
  [STAGES.SETUP]: { label: "Training", icon: "⚙", color: "#F59E0B" },
  [STAGES.SEARCH]: { label: "Suche", icon: "🔍", color: "#3B82F6" },
  [STAGES.CLASSIFY]: { label: "KI-Scoring", icon: "🏷", color: "#8B5CF6" },
  [STAGES.REVIEW]: { label: "HITL Review", icon: "👁", color: "#EC4899" },
  [STAGES.CONTACT]: { label: "Kontakt", icon: "✉", color: "#10B981" },
  [STAGES.PURCHASE]: { label: "Einkauf", icon: "🛒", color: "#06B6D4" },
  [STAGES.RESALE]: { label: "Verkauf", icon: "💰", color: "#F97316" },
  [STAGES.ANALYTICS]: { label: "Analytics", icon: "📊", color: "#6366F1" },
};

// ─── LISTING GENERATOR ───
function generateListings(config) {
  const titles = {
    Elektronik: ["iPhone 14 Pro Max 256GB", "MacBook Air M2 2023", "Sony WH-1000XM5", "iPad Air 5. Gen", "Samsung Galaxy S23 Ultra", "Nintendo Switch OLED", "AirPods Pro 2", "PS5 Disc Edition", "Steam Deck 512GB", "Dyson V15 Detect"],
    "Möbel": ["IKEA Kallax Regal weiß", "Echtholz Esstisch Eiche massiv", "Chesterfield Sofa Leder braun", "USM Haller Sideboard", "Vitra Eames Chair Original"],
    "Mode & Accessoires": ["Canada Goose Expedition Parka M", "Nike Air Jordan 1 Retro High OG 43", "Louis Vuitton Neverfull MM", "Vintage Levi's 501 W32", "Rolex Datejust 36mm"],
    "Sammlerstücke": ["Pokémon Karten 1. Edition Glurak", "LEGO Star Wars UCS 75192", "Vinyl Sammlung 200+ LPs Rock", "Briefmarken Dt. Reich komplett", "Hot Wheels Redline Sammlung"],
    "Spielzeug & Games": ["LEGO Technic Liebherr LTM", "Playmobil Ritterburg komplett", "Ravensburger Puzzle Sammlung", "Carrera Digital 132 Set"],
    "Haushaltsgeräte": ["Thermomix TM6 komplett", "Miele Staubsauger Complete C3", "KitchenAid Artisan 5KSM175", "Nespresso Lattissima Pro"],
    "Büro & IT": ["Herman Miller Aeron Chair", "Dell U3423WE Monitor 34\"", "Logitech MX Master 3S", "Steelcase Leap V2"],
  };

  const locations = ["Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Hannover", "Nürnberg", "Bremen", "Essen", "Dortmund", "Bonn"];
  const platforms = config.platforms.length > 0 ? config.platforms : ["kleinanzeigen"];

  const sellerProfiles = {
    commercial: [
      { name: "TechDeal24_Shop", rating: 4.8, sales: 1240, badge: "PowerSeller" },
      { name: "ElektroMarkt_B2C", rating: 4.5, sales: 890, badge: "Top-Bewertet" },
      { name: "Möbelhaus_Online", rating: 4.2, sales: 320, badge: "Gewerblich" },
    ],
    private_clear: [
      { name: "Maria_Umzug2024", rating: 0, sales: 12, badge: "Auflösung" },
      { name: "Keller_Raeumung_HH", rating: 0, sales: 28, badge: "Alles muss raus" },
      { name: "Haus_Entrümpelung", rating: 0, sales: 45, badge: "Sammelabgabe" },
      { name: "Scheidung_Neustart", rating: 0, sales: 8, badge: "Schnell weg" },
    ],
    private: [
      { name: "max_m_87", rating: 4.1, sales: 3, badge: null },
      { name: "sarah.vintage", rating: 4.6, sales: 15, badge: null },
      { name: "flip_hobby_22", rating: 3.9, sales: 7, badge: null },
    ],
  };

  const results = [];
  const count = 10 + Math.floor(Math.random() * 15);

  for (let i = 0; i < count; i++) {
    const cat = config.categories[Math.floor(Math.random() * config.categories.length)] || "Elektronik";
    const pool = titles[cat] || titles.Elektronik;
    const title = pool[Math.floor(Math.random() * pool.length)];
    const condition = Object.keys(CONDITION_MAP)[Math.floor(Math.random() * Object.keys(CONDITION_MAP).length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const sellerTypeKey = config.sellerTypes.length > 0
      ? config.sellerTypes[Math.floor(Math.random() * config.sellerTypes.length)]
      : "private";
    const sellerPool = sellerProfiles[sellerTypeKey];
    const seller = sellerPool[Math.floor(Math.random() * sellerPool.length)];
    const basePrice = config.minPrice + Math.floor(Math.random() * (config.maxPrice - config.minPrice));
    const isAufloesung = sellerTypeKey === "private_clear";
    const discount = isAufloesung ? 0.5 + Math.random() * 0.3 : 0.7 + Math.random() * 0.25;
    const price = Math.floor(basePrice * discount);
    const marketValue = basePrice + Math.floor(Math.random() * basePrice * 0.3);
    const margin = ((marketValue - price) / price * 100).toFixed(1);
    const negotiable = Math.random() > 0.4;
    const urgency = isAufloesung ? (Math.random() > 0.3 ? "high" : "medium") : (Math.random() > 0.7 ? "medium" : "low");

    results.push({
      id: `${platform.toUpperCase().slice(0, 2)}-${Date.now()}-${i}`,
      title, category: cat, price, marketValue,
      margin: parseFloat(margin), condition, platform,
      location: locations[Math.floor(Math.random() * locations.length)],
      seller, sellerType: sellerTypeKey,
      posted: `vor ${1 + Math.floor(Math.random() * 72)}h`,
      images: 1 + Math.floor(Math.random() * 8),
      description: `${title} — ${CONDITION_MAP[condition].label}. ${negotiable ? "VB" : "Festpreis"}. ${isAufloesung ? "Alles muss raus!" : "Versand möglich."}`,
      aiScore: Math.floor(35 + Math.random() * 65),
      status: "new",
      negotiable, urgency,
      matchKeywords: config.keywords.filter(() => Math.random() > 0.35),
      bestResalePlatform: null,
    });
  }

  // Calculate best resale platform
  results.forEach(item => {
    let bestPlatform = null;
    let bestNet = 0;
    Object.entries(PLATFORMS).forEach(([key, p]) => {
      if (key !== item.platform) {
        const net = item.marketValue * (1 - p.fees / 100);
        if (net > bestNet) { bestNet = net; bestPlatform = key; }
      }
    });
    item.bestResalePlatform = bestPlatform;
    item.bestResaleNet = Math.floor(bestNet);
  });

  return results.sort((a, b) => b.aiScore - a.aiScore);
}

// ─── SHARED UI ───
const inputStyle = {
  background: "#0a0a15", border: "1px solid #ffffff12", borderRadius: 8,
  padding: "10px 14px", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit",
  outline: "none", width: "100%", boxSizing: "border-box",
};

function Badge({ children, color = "#6366F1", size = "sm" }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}33`,
      padding: size === "sm" ? "2px 8px" : "4px 12px", borderRadius: 6,
      fontSize: size === "sm" ? 11 : 13, fontWeight: 600, letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function ProgressBar({ value, max = 100, color = "#3B82F6", height = 6 }) {
  return (
    <div style={{ background: "#1a1a2e", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{
        width: `${Math.min((value / max) * 100, 100)}%`, height: "100%",
        background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: 99,
        transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
      }} />
    </div>
  );
}

function Card({ children, style = {}, onClick, glow }) {
  return (
    <div onClick={onClick} style={{
      background: glow ? "linear-gradient(135deg, #12121e, #16213e)" : "#12121e",
      border: `1px solid ${glow ? glow + "33" : "#ffffff08"}`,
      borderRadius: 12, padding: 18, cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s ease", ...style,
    }}>{children}</div>
  );
}

function Btn({ label, onClick, variant = "primary", icon, disabled, small }) {
  const colors = {
    primary: "#3B82F6", approve: "#10B981", reject: "#EF4444",
    warn: "#F59E0B", ghost: "transparent", sell: "#F97316",
  };
  const bg = colors[variant] || colors.primary;
  const isGhost = variant === "ghost";
  return (
    <button disabled={disabled} onClick={onClick} style={{
      background: isGhost ? "transparent" : bg, color: isGhost ? "#94a3b8" : "#fff",
      border: isGhost ? "1px solid #ffffff15" : "none", borderRadius: 8,
      padding: small ? "6px 12px" : "10px 18px", fontSize: small ? 12 : 14,
      fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.35 : 1, display: "inline-flex", alignItems: "center",
      gap: 6, transition: "all 0.15s ease", fontFamily: "inherit", whiteSpace: "nowrap",
    }}>
      {icon && <span style={{ fontSize: small ? 13 : 15 }}>{icon}</span>}{label}
    </button>
  );
}

function PlatformBadge({ platformKey, size = "sm" }) {
  const p = PLATFORMS[platformKey];
  if (!p) return null;
  return <Badge color={p.color} size={size}>{p.icon} {p.name}</Badge>;
}

function SellerBadge({ type }) {
  const s = SELLER_TYPES[type];
  if (!s) return null;
  return <Badge color={s.color}>{s.icon} {s.label}</Badge>;
}

function UrgencyDot({ level }) {
  const c = level === "high" ? "#EF4444" : level === "medium" ? "#F59E0B" : "#475569";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: level === "high" ? `0 0 6px ${c}88` : "none" }} />;
}

function SectionLabel({ children }) {
  return (
    <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
      {children}
    </label>
  );
}

// ─── DASHBOARD ───
function DashboardStage({ listings, accounts, onNavigate }) {
  const purchased = listings.filter(l => ["purchased", "listed", "sold"].includes(l.status));
  const sold = listings.filter(l => l.status === "sold");
  const listed = listings.filter(l => l.status === "listed");
  const totalInvest = purchased.reduce((s, i) => s + i.price, 0);
  const totalProfit = sold.reduce((s, i) => s + ((i.resalePrice || i.marketValue) - i.price), 0);
  const activeDeals = listings.filter(l => ["approved", "contacted", "purchased", "listed"].includes(l.status)).length;
  const buyAccounts = accounts.filter(a => a.purpose === "buy" || a.purpose === "both").length;
  const sellAccounts = accounts.filter(a => a.purpose === "sell" || a.purpose === "both").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, color: "#e2e8f0", fontFamily: "'Space Mono', monospace", letterSpacing: "-0.03em" }}>
          ⬡ Command Center
        </h2>
        <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>
          Multi-Plattform Arbitrage — Einkauf · Klassifizierung · Verkauf
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Aktive Deals", value: activeDeals, color: "#3B82F6", icon: "🔄" },
          { label: "Investiert", value: `${totalInvest}€`, color: "#06B6D4", icon: "💸" },
          { label: "Gewinn", value: `+${totalProfit}€`, color: "#10B981", icon: "📈" },
          { label: "Accounts", value: `${buyAccounts}B/${sellAccounts}S`, color: "#8B5CF6", icon: "🔑" },
        ].map(kpi => (
          <Card key={kpi.label} style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{kpi.icon}</div>
            <div style={{ color: kpi.color, fontSize: 22, fontWeight: 800 }}>{kpi.value}</div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{kpi.label}</div>
          </Card>
        ))}
      </div>

      {/* Platform Overview */}
      <Card>
        <SectionLabel>Plattform-Status</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {Object.entries(PLATFORMS).map(([key, p]) => {
            const count = listings.filter(l => l.platform === key).length;
            const accs = accounts.filter(a => a.platform === key).length;
            return (
              <div key={key} style={{
                background: "#0a0a15", borderRadius: 10, padding: 14,
                border: `1px solid ${p.color}22`, display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: p.color }}>{p.icon} {p.name}</span>
                  {accs > 0 && <Badge color="#10B981">{accs} Acc</Badge>}
                </div>
                <div style={{ color: "#475569", fontSize: 11 }}>
                  {count} Listings · {p.fees}% Gebühr
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Card onClick={() => onNavigate(STAGES.ACCOUNTS)} style={{ cursor: "pointer", textAlign: "center", padding: 20 }} glow="#06B6D4">
          <div style={{ fontSize: 28, marginBottom: 6 }}>🔑</div>
          <div style={{ color: "#06B6D4", fontWeight: 700, fontSize: 14 }}>Accounts verwalten</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>Kauf- & Verkaufs-Accounts</div>
        </Card>
        <Card onClick={() => onNavigate(STAGES.SETUP)} style={{ cursor: "pointer", textAlign: "center", padding: 20 }} glow="#F59E0B">
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎯</div>
          <div style={{ color: "#F59E0B", fontWeight: 700, fontSize: 14 }}>Neue Suche starten</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>Training & Parameter</div>
        </Card>
        <Card onClick={() => onNavigate(STAGES.ANALYTICS)} style={{ cursor: "pointer", textAlign: "center", padding: 20 }} glow="#6366F1">
          <div style={{ fontSize: 28, marginBottom: 6 }}>📊</div>
          <div style={{ color: "#6366F1", fontWeight: 700, fontSize: 14 }}>Analytics öffnen</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>Performance & Funnel</div>
        </Card>
      </div>

      {/* Recent Activity */}
      {listings.length > 0 && (
        <Card>
          <SectionLabel>Letzte Aktivität</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {listings.slice(0, 5).map(item => (
              <div key={item.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", background: "#0a0a15", borderRadius: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <PlatformBadge platformKey={item.platform} />
                  <span style={{ color: "#e2e8f0", fontSize: 13 }}>{item.title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#10B981", fontWeight: 700, fontSize: 13 }}>{item.price}€</span>
                  <Badge color={
                    item.status === "sold" ? "#10B981" : item.status === "listed" ? "#F97316" :
                    item.status === "purchased" ? "#06B6D4" : "#475569"
                  }>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── ACCOUNTS MANAGER ───
function AccountsStage({ accounts, setAccounts }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newAcc, setNewAcc] = useState({ platform: "kleinanzeigen", name: "", purpose: "buy", email: "", notes: "" });

  const addAccount = () => {
    if (!newAcc.name.trim()) return;
    setAccounts(a => [...a, { ...newAcc, id: `acc-${Date.now()}`, active: true, created: new Date().toISOString() }]);
    setNewAcc({ platform: "kleinanzeigen", name: "", purpose: "buy", email: "", notes: "" });
    setShowAdd(false);
  };

  const toggleActive = (id) => setAccounts(a => a.map(acc => acc.id === id ? { ...acc, active: !acc.active } : acc));
  const removeAccount = (id) => setAccounts(a => a.filter(acc => acc.id !== id));

  const purposeColors = { buy: "#3B82F6", sell: "#F97316", both: "#10B981" };
  const purposeLabels = { buy: "🛒 Einkauf", sell: "💰 Verkauf", both: "🔄 Beides" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#06B6D4", fontFamily: "'Space Mono', monospace" }}>🔑 Account-Manager</h2>
          <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>
            Separate Accounts für Einkauf & Verkauf pro Plattform.
          </p>
        </div>
        <Btn label="Account hinzufügen" icon="+" onClick={() => setShowAdd(!showAdd)} />
      </div>

      {/* Why separate accounts */}
      <Card glow="#F59E0B" style={{ borderLeft: "3px solid #F59E0B" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div>
            <div style={{ color: "#F59E0B", fontWeight: 700, fontSize: 13 }}>Warum separate Accounts?</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              Einkaufs-Accounts bleiben als "Privatkäufer" unauffällig. Verkaufs-Accounts bauen Reputation & Bewertungen auf.
              So vermeidest du Preisverzerrung und nutzt plattformspezifische Vorteile optimal.
            </div>
          </div>
        </div>
      </Card>

      {/* Add Form */}
      {showAdd && (
        <Card glow="#06B6D4">
          <SectionLabel>Neuer Account</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Plattform</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(PLATFORMS).map(([key, p]) => (
                  <span key={key} onClick={() => setNewAcc(a => ({ ...a, platform: key }))}
                    style={{
                      background: newAcc.platform === key ? p.color + "20" : "#0a0a15",
                      color: newAcc.platform === key ? p.color : "#475569",
                      border: `1px solid ${newAcc.platform === key ? p.color + "44" : "#ffffff0a"}`,
                      padding: "6px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}>{p.icon} {p.name}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Zweck</div>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(purposeLabels).map(([key, label]) => (
                  <span key={key} onClick={() => setNewAcc(a => ({ ...a, purpose: key }))}
                    style={{
                      background: newAcc.purpose === key ? purposeColors[key] + "20" : "#0a0a15",
                      color: newAcc.purpose === key ? purposeColors[key] : "#475569",
                      border: `1px solid ${newAcc.purpose === key ? purposeColors[key] + "44" : "#ffffff0a"}`,
                      padding: "6px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}>{label}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Account-Name</div>
              <input value={newAcc.name} onChange={e => setNewAcc(a => ({ ...a, name: e.target.value }))}
                placeholder="z.B. max_einkauf_01" style={inputStyle} />
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>E-Mail</div>
              <input value={newAcc.email} onChange={e => setNewAcc(a => ({ ...a, email: e.target.value }))}
                placeholder="account@email.de" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <Btn label="Abbrechen" variant="ghost" onClick={() => setShowAdd(false)} small />
            <Btn label="Speichern" variant="approve" onClick={addAccount} disabled={!newAcc.name.trim()} small />
          </div>
        </Card>
      )}

      {/* Account List */}
      {Object.entries(PLATFORMS).map(([platKey, plat]) => {
        const platAccounts = accounts.filter(a => a.platform === platKey);
        if (platAccounts.length === 0) return null;
        return (
          <div key={platKey}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: plat.color, fontSize: 16 }}>{plat.icon}</span>
              <span style={{ color: plat.color, fontWeight: 700, fontSize: 14 }}>{plat.name}</span>
              <span style={{ color: "#475569", fontSize: 12 }}>· {plat.fees}% Gebühr</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {platAccounts.map(acc => (
                <Card key={acc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: acc.active ? "#10B981" : "#EF4444",
                      boxShadow: acc.active ? "0 0 6px #10B98166" : "none",
                    }} />
                    <div>
                      <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{acc.name}</div>
                      <div style={{ color: "#475569", fontSize: 11 }}>{acc.email || "Keine E-Mail"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge color={purposeColors[acc.purpose]}>{purposeLabels[acc.purpose]}</Badge>
                    <Btn label={acc.active ? "⏸" : "▶"} variant="ghost" onClick={() => toggleActive(acc.id)} small />
                    <Btn label="🗑" variant="ghost" onClick={() => removeAccount(acc.id)} small />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {accounts.length === 0 && (
        <Card style={{ textAlign: "center", padding: 40, color: "#475569" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
          <div>Noch keine Accounts angelegt. Starte mit "Account hinzufügen".</div>
        </Card>
      )}
    </div>
  );
}

// ─── SETUP / TRAINING ───
function SetupStage({ config, setConfig, onNext }) {
  const [newKw, setNewKw] = useState("");
  const addKw = () => { if (newKw.trim()) { setConfig(c => ({ ...c, keywords: [...new Set([...c.keywords, newKw.trim()])] })); setNewKw(""); } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0, fontSize: 22, color: "#F59E0B", fontFamily: "'Space Mono', monospace" }}>⚙ Training & Parameter</h2>

      {/* Platforms */}
      <Card>
        <SectionLabel>Plattformen durchsuchen</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(PLATFORMS).map(([key, p]) => (
            <span key={key} onClick={() => setConfig(c => ({
              ...c, platforms: c.platforms.includes(key) ? c.platforms.filter(x => x !== key) : [...c.platforms, key],
            }))} style={{
              background: config.platforms.includes(key) ? p.color + "20" : "#0a0a15",
              color: config.platforms.includes(key) ? p.color : "#475569",
              border: `1px solid ${config.platforms.includes(key) ? p.color + "44" : "#ffffff0a"}`,
              padding: "10px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600,
              transition: "all 0.15s ease",
            }}>{p.icon} {p.name} <span style={{ opacity: 0.5, fontSize: 11 }}>({p.fees}%)</span></span>
          ))}
        </div>
      </Card>

      {/* Seller Types */}
      <Card>
        <SectionLabel>Zielgruppe / Verkäufertyp</SectionLabel>
        <div style={{ display: "flex", gap: 10 }}>
          {Object.entries(SELLER_TYPES).map(([key, s]) => (
            <div key={key} onClick={() => setConfig(c => ({
              ...c, sellerTypes: c.sellerTypes.includes(key) ? c.sellerTypes.filter(x => x !== key) : [...c.sellerTypes, key],
            }))} style={{
              flex: 1, background: config.sellerTypes.includes(key) ? s.color + "12" : "#0a0a15",
              border: `1px solid ${config.sellerTypes.includes(key) ? s.color + "44" : "#ffffff0a"}`,
              borderRadius: 10, padding: 14, cursor: "pointer", transition: "all 0.15s ease",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: config.sellerTypes.includes(key) ? s.color : "#94a3b8", fontWeight: 700, fontSize: 13 }}>{s.label}</div>
              <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Keywords */}
      <Card>
        <SectionLabel>Suchwörter</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newKw} onChange={e => setNewKw(e.target.value)} onKeyDown={e => e.key === "Enter" && addKw()}
            placeholder="z.B. iPhone, LEGO, Thermomix..." style={{ ...inputStyle, flex: 1 }} />
          <Btn label="+" onClick={addKw} small />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {config.keywords.map(k => (
            <span key={k} onClick={() => setConfig(c => ({ ...c, keywords: c.keywords.filter(x => x !== k) }))}
              style={{ background: "#F59E0B14", color: "#F59E0B", border: "1px solid #F59E0B33",
                padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              {k} ×
            </span>
          ))}
        </div>
      </Card>

      {/* Categories */}
      <Card>
        <SectionLabel>Kategorien</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CATEGORIES.map(cat => (
            <span key={cat} onClick={() => setConfig(c => ({
              ...c, categories: c.categories.includes(cat) ? c.categories.filter(x => x !== cat) : [...c.categories, cat],
            }))} style={{
              background: config.categories.includes(cat) ? "#3B82F618" : "#0a0a15",
              color: config.categories.includes(cat) ? "#3B82F6" : "#475569",
              border: `1px solid ${config.categories.includes(cat) ? "#3B82F633" : "#ffffff08"}`,
              padding: "7px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontWeight: 500,
            }}>{cat}</span>
          ))}
        </div>
      </Card>

      {/* Price & Margin */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Card>
          <SectionLabel>Min Preis (€)</SectionLabel>
          <input type="number" value={config.minPrice} onChange={e => setConfig(c => ({ ...c, minPrice: +e.target.value }))} style={inputStyle} />
        </Card>
        <Card>
          <SectionLabel>Max Preis (€)</SectionLabel>
          <input type="number" value={config.maxPrice} onChange={e => setConfig(c => ({ ...c, maxPrice: +e.target.value }))} style={inputStyle} />
        </Card>
        <Card>
          <SectionLabel>Min Marge (%)</SectionLabel>
          <input type="range" min={0} max={100} value={config.minMargin}
            onChange={e => setConfig(c => ({ ...c, minMargin: +e.target.value }))}
            style={{ width: "100%", accentColor: "#10B981", marginTop: 4 }} />
          <div style={{ color: "#10B981", fontWeight: 800, fontSize: 18, textAlign: "center" }}>{config.minMargin}%</div>
        </Card>
      </div>

      {/* Images + Location */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <SectionLabel>Referenzbilder (KI-Training)</SectionLabel>
          <div onClick={() => setConfig(c => ({ ...c, refImages: [...c.refImages, { name: `ref_${c.refImages.length + 1}.jpg` }] }))}
            style={{ border: "2px dashed #ffffff10", borderRadius: 10, padding: 24, textAlign: "center", color: "#475569", cursor: "pointer" }}>
            <div style={{ fontSize: 24 }}>📸</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Klicke zum Hochladen</div>
          </div>
          {config.refImages.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {config.refImages.map((img, i) => (
                <span key={i} style={{ background: "#0a0a15", padding: "4px 8px", borderRadius: 4, fontSize: 11, color: "#64748b" }}>
                  🖼 {img.name}
                  <span onClick={() => setConfig(c => ({ ...c, refImages: c.refImages.filter((_, j) => j !== i) }))}
                    style={{ cursor: "pointer", color: "#EF4444", marginLeft: 4 }}>×</span>
                </span>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <SectionLabel>Standort & Umkreis</SectionLabel>
          <input value={config.location} onChange={e => setConfig(c => ({ ...c, location: e.target.value }))}
            placeholder="Stadt" style={{ ...inputStyle, marginBottom: 8 }} />
          <input type="number" value={config.radius} onChange={e => setConfig(c => ({ ...c, radius: +e.target.value }))}
            placeholder="Umkreis km" style={inputStyle} />
        </Card>
      </div>

      {/* Resale Markup */}
      <Card>
        <SectionLabel>KI & Verkauf Konfiguration</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Auto-Kontakt ab Score</div>
            <input type="number" value={config.autoContactThreshold}
              onChange={e => setConfig(c => ({ ...c, autoContactThreshold: +e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Max. Parallel-Deals</div>
            <input type="number" value={config.maxParallelDeals}
              onChange={e => setConfig(c => ({ ...c, maxParallelDeals: +e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Resale Markup %</div>
            <input type="number" value={config.resaleMarkup}
              onChange={e => setConfig(c => ({ ...c, resaleMarkup: +e.target.value }))} style={inputStyle} />
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn label="Multi-Plattform Suche starten" icon="🚀" onClick={onNext}
          disabled={config.platforms.length === 0 || (config.keywords.length === 0 && config.categories.length === 0)} />
      </div>
    </div>
  );
}

// ─── SEARCH ───
function SearchStage({ listings, searching, onClassify }) {
  const grouped = {};
  listings.forEach(l => { grouped[l.platform] = grouped[l.platform] || []; grouped[l.platform].push(l); });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#3B82F6", fontFamily: "'Space Mono', monospace" }}>🔍 Suchergebnisse</h2>
          <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>
            {searching ? "Scanne Plattformen..." : `${listings.length} Listings auf ${Object.keys(grouped).length} Plattformen`}
          </p>
        </div>
        {!searching && <Btn label="Alle klassifizieren" icon="🏷" onClick={onClassify} />}
      </div>

      {searching ? (
        <Card style={{ textAlign: "center", padding: 50 }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 2s linear infinite" }}>🔍</div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Multi-Plattform Scan läuft...</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
            {Object.values(PLATFORMS).slice(0, 4).map(p => (
              <span key={p.name} style={{ color: p.color, fontSize: 12, fontWeight: 600, animation: "pulse 1.5s infinite" }}>
                {p.icon} {p.name}
              </span>
            ))}
          </div>
          <div style={{ maxWidth: 300, margin: "16px auto 0" }}><ProgressBar value={60} color="#3B82F6" /></div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }`}</style>
        </Card>
      ) : (
        Object.entries(grouped).map(([platKey, items]) => (
          <div key={platKey}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "4px 0" }}>
              <span style={{ color: PLATFORMS[platKey]?.color, fontWeight: 700, fontSize: 14 }}>
                {PLATFORMS[platKey]?.icon} {PLATFORMS[platKey]?.name}
              </span>
              <Badge color={PLATFORMS[platKey]?.color}>{items.length} Treffer</Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map(item => (
                <Card key={item.id} style={{ display: "flex", gap: 14, padding: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 8, background: "#1a1a2e",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
                  }}>
                    {item.category === "Elektronik" ? "📱" : item.category === "Möbel" ? "🪑" :
                      item.category.includes("Mode") ? "👗" : item.category.includes("Samml") ? "💎" :
                      item.category.includes("Spiel") ? "🎮" : "📦"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{item.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <UrgencyDot level={item.urgency} />
                        <span style={{ fontSize: 17, fontWeight: 800, color: "#10B981" }}>{item.price}€</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                      <SellerBadge type={item.sellerType} />
                      <Badge color={CONDITION_MAP[item.condition].color}>{CONDITION_MAP[item.condition].label}</Badge>
                      <Badge color="#475569">📍{item.location}</Badge>
                      <Badge color="#475569">🕐{item.posted}</Badge>
                      {item.negotiable && <Badge color="#F59E0B">VB</Badge>}
                    </div>
                    <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>
                      👤 {item.seller.name} {item.seller.badge && <Badge color="#64748b">{item.seller.badge}</Badge>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── CLASSIFY ───
function ClassifyStage({ listings, onReview }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#8B5CF6", fontFamily: "'Space Mono', monospace" }}>🏷 KI-Scoring & Arbitrage-Analyse</h2>
          <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>Cross-Plattform Marge inkl. Gebühren berechnet.</p>
        </div>
        <Btn label="HITL Review starten" icon="👁" onClick={onReview} />
      </div>

      {listings.map(item => {
        const sc = item.aiScore;
        const scoreColor = sc >= 80 ? "#10B981" : sc >= 60 ? "#F59E0B" : "#EF4444";
        return (
          <Card key={item.id} glow={sc >= 80 ? "#10B981" : null}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <PlatformBadge platformKey={item.platform} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{item.title}</span>
                  {item.urgency === "high" && <Badge color="#EF4444">⚡ Dringend</Badge>}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <SellerBadge type={item.sellerType} />
                  <Badge color={CONDITION_MAP[item.condition].color}>{CONDITION_MAP[item.condition].label}</Badge>
                  {item.negotiable && <Badge color="#F59E0B">VB</Badge>}
                </div>
              </div>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: scoreColor + "18",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: 19, fontWeight: 800, color: scoreColor }}>{sc}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 14 }}>
              {[
                { l: "EK-Preis", v: `${item.price}€`, c: "#e2e8f0" },
                { l: "Marktwert", v: `${item.marketValue}€`, c: "#3B82F6" },
                { l: "Marge", v: `+${item.margin}%`, c: item.margin >= 30 ? "#10B981" : "#F59E0B" },
                { l: "Best Resale", v: PLATFORMS[item.bestResalePlatform]?.name || "—", c: PLATFORMS[item.bestResalePlatform]?.color || "#475569" },
                { l: "Netto-Erlös", v: `${item.bestResaleNet || "—"}€`, c: "#10B981" },
              ].map(d => (
                <div key={d.l}>
                  <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.l}</div>
                  <div style={{ color: d.c, fontWeight: 700, fontSize: 15, marginTop: 2 }}>{d.v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10 }}>
              <ProgressBar value={sc} color={scoreColor} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── HITL REVIEW ───
function ReviewStage({ listings, setListings, onContact }) {
  const pending = listings.filter(l => l.status === "new");
  const approved = listings.filter(l => l.status === "approved");
  const rejected = listings.filter(l => l.status === "rejected");

  const act = (id, status) => setListings(ls => ls.map(l => l.id === id ? { ...l, status } : l));
  const approveHigh = () => setListings(ls => ls.map(l => l.status === "new" && l.aiScore >= 70 ? { ...l, status: "approved" } : l));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#EC4899", fontFamily: "'Space Mono', monospace" }}>👁 HITL Review</h2>
          <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>Deine Entscheidung — jedes Listing einzeln oder bulk.</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn label={`Auto ≥70 (${pending.filter(l => l.aiScore >= 70).length})`} icon="✓" variant="approve" onClick={approveHigh} small />
          <Btn label="Kontaktieren" icon="✉" onClick={onContact} disabled={approved.length === 0} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { l: "Ausstehend", c: pending.length, color: "#F59E0B" },
          { l: "Genehmigt", c: approved.length, color: "#10B981" },
          { l: "Abgelehnt", c: rejected.length, color: "#EF4444" },
        ].map(s => (
          <Card key={s.l} style={{ textAlign: "center", padding: 14 }}>
            <div style={{ color: s.color, fontSize: 26, fontWeight: 800 }}>{s.c}</div>
            <div style={{ color: "#475569", fontSize: 11 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      {pending.map(item => (
        <Card key={item.id} style={{ borderLeft: `3px solid ${item.aiScore >= 70 ? "#10B981" : "#F59E0B"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PlatformBadge platformKey={item.platform} />
                <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{item.title}</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                <SellerBadge type={item.sellerType} />
                <Badge color={CONDITION_MAP[item.condition].color}>{CONDITION_MAP[item.condition].label}</Badge>
                <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{item.price}€</span>
                <span style={{ color: "#475569" }}>→</span>
                <span style={{ color: "#10B981", fontWeight: 700 }}>{item.marketValue}€</span>
                <Badge color="#10B981">+{item.margin}%</Badge>
                <Badge color={item.aiScore >= 70 ? "#10B981" : "#F59E0B"}>AI:{item.aiScore}</Badge>
                {item.bestResalePlatform && <Badge color={PLATFORMS[item.bestResalePlatform]?.color}>
                  → {PLATFORMS[item.bestResalePlatform]?.icon} Resale
                </Badge>}
              </div>
              <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>
                👤 {item.seller.name} · 📍 {item.location} · 🕐 {item.posted}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
              <Btn label="✓" variant="approve" onClick={() => act(item.id, "approved")} small />
              <Btn label="✗" variant="reject" onClick={() => act(item.id, "rejected")} small />
              <Btn label="👀" variant="warn" onClick={() => act(item.id, "watchlist")} small />
            </div>
          </div>
        </Card>
      ))}

      {approved.length > 0 && (
        <div>
          <div style={{ color: "#10B981", fontSize: 13, fontWeight: 700, margin: "6px 0" }}>✓ Genehmigt ({approved.length})</div>
          {approved.map(item => (
            <div key={item.id} style={{
              display: "flex", justifyContent: "space-between", padding: "8px 12px",
              background: "#10B98108", borderLeft: "3px solid #10B981", borderRadius: 6, marginBottom: 4,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PlatformBadge platformKey={item.platform} />
                <span style={{ color: "#e2e8f0", fontSize: 12 }}>{item.title}</span>
              </div>
              <span style={{ color: "#10B981", fontWeight: 700, fontSize: 12 }}>{item.price}€ → {item.marketValue}€</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CONTACT ───
function ContactStage({ listings, setListings, accounts, onPurchase }) {
  const approved = listings.filter(l => l.status === "approved");
  const contacted = listings.filter(l => l.status === "contacted");
  const [tmpl, setTmpl] = useState("friendly");
  const buyAccounts = accounts.filter(a => (a.purpose === "buy" || a.purpose === "both") && a.active);

  const templates = {
    friendly: { label: "Freundlich", fn: (i) => `Hallo! Ich habe Ihre Anzeige "${i.title}" gesehen und bin sehr interessiert. Ist der Artikel noch verfügbar? Kann zeitnah abholen. Viele Grüße!` },
    negotiate: { label: "Verhandlung", fn: (i) => `Hi, "${i.title}" interessiert mich. Wäre bei ${Math.floor(i.price * 0.8)}€ was möglich? Bin flexibel bei der Abholung. Beste Grüße!` },
    clearance: { label: "Sammelkauf", fn: (i) => `Hallo! Ich sehe Sie lösen auf — hätten Sie noch mehr Artikel? Würde gerne mehrere Sachen zusammen nehmen. Melde mich gerne telefonisch. VG` },
    direct: { label: "Direkt", fn: (i) => `Guten Tag, "${i.title}" — noch verfügbar? Nehme zum Festpreis. Kann heute abholen. MfG` },
  };

  const contact = (id) => setListings(ls => ls.map(l => l.id === id ? { ...l, status: "contacted" } : l));
  const contactAll = () => setListings(ls => ls.map(l => l.status === "approved" ? { ...l, status: "contacted" } : l));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#10B981", fontFamily: "'Space Mono', monospace" }}>✉ Kontaktaufnahme</h2>
          <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>
            Nachrichten über Einkauf-Accounts senden. {buyAccounts.length} aktive Kauf-Accounts.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn label={`Alle senden (${approved.length})`} icon="📨" variant="approve" onClick={contactAll} disabled={approved.length === 0} small />
          <Btn label="Einkauf" icon="🛒" onClick={onPurchase} disabled={contacted.length === 0} />
        </div>
      </div>

      {/* Account Selector */}
      {buyAccounts.length > 0 && (
        <Card>
          <SectionLabel>Absender-Account</SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {buyAccounts.map(acc => (
              <div key={acc.id} style={{
                background: "#0a0a15", padding: "8px 12px", borderRadius: 8,
                border: "1px solid #ffffff0a", display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ color: PLATFORMS[acc.platform]?.color, fontSize: 12 }}>{PLATFORMS[acc.platform]?.icon}</span>
                <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>{acc.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Templates */}
      <Card>
        <SectionLabel>Nachrichtenvorlage</SectionLabel>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(templates).map(([key, t]) => (
            <span key={key} onClick={() => setTmpl(key)} style={{
              background: tmpl === key ? "#10B98118" : "#0a0a15",
              color: tmpl === key ? "#10B981" : "#475569",
              border: `1px solid ${tmpl === key ? "#10B98133" : "#ffffff08"}`,
              padding: "7px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}>{t.label}</span>
          ))}
        </div>
      </Card>

      {approved.map(item => (
        <Card key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <PlatformBadge platformKey={item.platform} />
              <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>{item.title}</span>
              <span style={{ color: "#10B981", fontWeight: 700, fontSize: 13 }}>{item.price}€</span>
            </div>
            <Btn label="Senden" icon="✉" variant="approve" onClick={() => contact(item.id)} small />
          </div>
          <div style={{ background: "#0a0a15", borderRadius: 8, padding: 12, fontSize: 12, color: "#94a3b8", lineHeight: 1.5, border: "1px solid #ffffff06" }}>
            {templates[tmpl].fn(item)}
          </div>
        </Card>
      ))}

      {contacted.length > 0 && (
        <div>
          <div style={{ color: "#06B6D4", fontSize: 13, fontWeight: 700, margin: "6px 0" }}>📨 Kontaktiert ({contacted.length})</div>
          {contacted.map(item => (
            <div key={item.id} style={{
              display: "flex", justifyContent: "space-between", padding: "8px 12px",
              background: "#06B6D408", borderLeft: "3px solid #06B6D4", borderRadius: 6, marginBottom: 4,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PlatformBadge platformKey={item.platform} />
                <span style={{ color: "#e2e8f0", fontSize: 12 }}>{item.title}</span>
              </div>
              <Badge color="#06B6D4">Warte auf Antwort</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PURCHASE ───
function PurchaseStage({ listings, setListings, onResale }) {
  const contacted = listings.filter(l => l.status === "contacted");
  const purchased = listings.filter(l => l.status === "purchased");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#06B6D4", fontFamily: "'Space Mono', monospace" }}>🛒 Einkauf abwickeln</h2>
        </div>
        <Btn label="Verkauf starten" icon="💰" onClick={onResale} disabled={purchased.length === 0} />
      </div>

      {contacted.map(item => (
        <Card key={item.id} style={{ borderLeft: "3px solid #06B6D4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PlatformBadge platformKey={item.platform} />
                <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{item.title}</span>
              </div>
              <div style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>
                {item.price}€ · {item.seller.name} · {item.location}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn label="Gekauft ✓" variant="approve"
                onClick={() => setListings(ls => ls.map(l => l.id === item.id ? { ...l, status: "purchased" } : l))} small />
              <Btn label="Abbruch" variant="reject"
                onClick={() => setListings(ls => ls.map(l => l.id === item.id ? { ...l, status: "cancelled" } : l))} small />
            </div>
          </div>
        </Card>
      ))}

      {purchased.length > 0 && (
        <>
          <div style={{ color: "#10B981", fontSize: 13, fontWeight: 700 }}>✓ Eingekauft ({purchased.length})</div>
          {purchased.map(item => (
            <Card key={item.id} style={{ padding: 12, display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PlatformBadge platformKey={item.platform} />
                <span style={{ color: "#e2e8f0", fontSize: 13 }}>{item.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#64748b", fontSize: 12 }}>EK: {item.price}€</span>
                <span style={{ color: "#475569" }}>→</span>
                <span style={{ color: "#10B981", fontSize: 12, fontWeight: 600 }}>Potenzial: +{item.marketValue - item.price}€</span>
              </div>
            </Card>
          ))}
          <Card glow="#10B981">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Investiert:</span>
              <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{purchased.reduce((s, i) => s + i.price, 0)}€</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── RESALE ───
function ResaleStage({ listings, setListings, accounts, config }) {
  const purchased = listings.filter(l => l.status === "purchased");
  const listed = listings.filter(l => l.status === "listed");
  const sold = listings.filter(l => l.status === "sold");
  const sellAccounts = accounts.filter(a => (a.purpose === "sell" || a.purpose === "both") && a.active);

  const listItem = (id) => {
    const item = listings.find(l => l.id === id);
    const target = item.bestResalePlatform || "ebay";
    const markup = config.resaleMarkup || 15;
    const resalePrice = Math.floor(item.marketValue * (1 + markup / 100));
    setListings(ls => ls.map(l => l.id === id ? { ...l, status: "listed", resalePrice, resalePlatform: target } : l));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0, fontSize: 22, color: "#F97316", fontFamily: "'Space Mono', monospace" }}>💰 Wiederverkauf</h2>

      {/* Sell Accounts */}
      {sellAccounts.length > 0 && (
        <Card>
          <SectionLabel>Verkauf-Accounts</SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {sellAccounts.map(acc => (
              <div key={acc.id} style={{
                background: "#0a0a15", padding: "6px 10px", borderRadius: 6,
                border: "1px solid #ffffff0a", display: "flex", alignItems: "center", gap: 6, fontSize: 12,
              }}>
                <span style={{ color: PLATFORMS[acc.platform]?.color }}>{PLATFORMS[acc.platform]?.icon}</span>
                <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{acc.name}</span>
                <Badge color="#F97316">Sell</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {purchased.map(item => {
        const target = item.bestResalePlatform || "ebay";
        const resalePrice = Math.floor(item.marketValue * (1 + (config.resaleMarkup || 15) / 100));
        const fees = Math.floor(resalePrice * (PLATFORMS[target]?.fees || 0) / 100);
        const netProfit = resalePrice - fees - item.price;
        return (
          <Card key={item.id} style={{ borderLeft: "3px solid #F97316" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <PlatformBadge platformKey={item.platform} />
                  <span style={{ color: "#475569" }}>→</span>
                  <PlatformBadge platformKey={target} />
                  <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{item.title}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: 16, marginTop: 10 }}>
                  <div><div style={{ color: "#475569", fontSize: 10 }}>EK</div><div style={{ color: "#e2e8f0", fontWeight: 700 }}>{item.price}€</div></div>
                  <div><div style={{ color: "#475569", fontSize: 10 }}>VK</div><div style={{ color: "#F97316", fontWeight: 700 }}>{resalePrice}€</div></div>
                  <div><div style={{ color: "#475569", fontSize: 10 }}>Gebühr</div><div style={{ color: "#EF4444", fontWeight: 700 }}>-{fees}€</div></div>
                  <div><div style={{ color: "#475569", fontSize: 10 }}>Netto</div><div style={{ color: "#10B981", fontWeight: 700 }}>+{netProfit}€</div></div>
                </div>
              </div>
              <Btn label="Einstellen" icon="📝" variant="sell" onClick={() => listItem(item.id)} small />
            </div>
          </Card>
        );
      })}

      {listed.map(item => (
        <Card key={item.id} style={{ borderLeft: "3px solid #F9731688", padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <PlatformBadge platformKey={item.resalePlatform || "ebay"} />
              <span style={{ color: "#e2e8f0", fontSize: 13 }}>{item.title}</span>
              <span style={{ color: "#F97316", fontWeight: 700 }}>{item.resalePrice}€</span>
              <Badge color="#F97316">Live</Badge>
            </div>
            <Btn label="Verkauft ✓" variant="approve"
              onClick={() => setListings(ls => ls.map(l => l.id === item.id ? { ...l, status: "sold" } : l))} small />
          </div>
        </Card>
      ))}

      {sold.length > 0 && (
        <Card glow="#10B981">
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#10B981", fontSize: 34, fontWeight: 800 }}>
              +{sold.reduce((s, i) => s + ((i.resalePrice || i.marketValue) - i.price), 0)}€
            </div>
            <div style={{ color: "#475569", fontSize: 13 }}>Gesamtgewinn aus {sold.length} Verkäufen</div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── ANALYTICS ───
function AnalyticsStage({ listings, accounts }) {
  const all = listings.length;
  const approved = listings.filter(l => ["approved", "contacted", "purchased", "listed", "sold"].includes(l.status)).length;
  const purchased = listings.filter(l => ["purchased", "listed", "sold"].includes(l.status)).length;
  const sold = listings.filter(l => l.status === "sold").length;
  const totalInvest = listings.filter(l => ["purchased", "listed", "sold"].includes(l.status)).reduce((s, i) => s + i.price, 0);
  const totalRev = listings.filter(l => l.status === "sold").reduce((s, i) => s + (i.resalePrice || i.marketValue), 0);
  const totalProfit = totalRev - listings.filter(l => l.status === "sold").reduce((s, i) => s + i.price, 0);

  const platformStats = {};
  listings.forEach(l => {
    if (!platformStats[l.platform]) platformStats[l.platform] = { found: 0, bought: 0, sold: 0, profit: 0 };
    platformStats[l.platform].found++;
    if (["purchased", "listed", "sold"].includes(l.status)) platformStats[l.platform].bought++;
    if (l.status === "sold") { platformStats[l.platform].sold++; platformStats[l.platform].profit += (l.resalePrice || l.marketValue) - l.price; }
  });

  const sellerStats = {};
  listings.forEach(l => {
    if (!sellerStats[l.sellerType]) sellerStats[l.sellerType] = { count: 0, avgPrice: 0, totalPrice: 0 };
    sellerStats[l.sellerType].count++;
    sellerStats[l.sellerType].totalPrice += l.price;
  });
  Object.values(sellerStats).forEach(s => s.avgPrice = Math.floor(s.totalPrice / s.count));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0, fontSize: 22, color: "#6366F1", fontFamily: "'Space Mono', monospace" }}>📊 Multi-Plattform Analytics</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { l: "Investiert", v: `${totalInvest}€`, c: "#3B82F6" },
          { l: "Umsatz", v: `${totalRev}€`, c: "#06B6D4" },
          { l: "Gewinn", v: `${totalProfit >= 0 ? "+" : ""}${totalProfit}€`, c: "#10B981" },
          { l: "ROI", v: totalInvest > 0 ? `${((totalProfit / totalInvest) * 100).toFixed(0)}%` : "—", c: "#F59E0B" },
        ].map(k => (
          <Card key={k.l} style={{ textAlign: "center", padding: 14 }}>
            <div style={{ color: k.c, fontSize: 22, fontWeight: 800 }}>{k.v}</div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{k.l}</div>
          </Card>
        ))}
      </div>

      {/* Funnel */}
      <Card>
        <SectionLabel>Conversion Funnel</SectionLabel>
        {[
          { l: "Gefunden", c: all, color: "#3B82F6" },
          { l: "Genehmigt", c: approved, color: "#EC4899" },
          { l: "Gekauft", c: purchased, color: "#06B6D4" },
          { l: "Verkauft", c: sold, color: "#10B981" },
        ].map(s => (
          <div key={s.l} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>{s.l}</span>
              <span style={{ color: s.color, fontWeight: 700, fontSize: 12 }}>{s.c} {all > 0 && `(${((s.c / all) * 100).toFixed(0)}%)`}</span>
            </div>
            <ProgressBar value={s.c} max={Math.max(all, 1)} color={s.color} height={10} />
          </div>
        ))}
      </Card>

      {/* Per Platform */}
      <Card>
        <SectionLabel>Performance pro Plattform</SectionLabel>
        {Object.entries(platformStats).map(([key, stats]) => (
          <div key={key} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: "1px solid #ffffff06",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PlatformBadge platformKey={key} />
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>Gefunden: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{stats.found}</span></span>
              <span style={{ color: "#64748b" }}>Gekauft: <span style={{ color: "#06B6D4", fontWeight: 600 }}>{stats.bought}</span></span>
              <span style={{ color: "#64748b" }}>Verkauft: <span style={{ color: "#10B981", fontWeight: 600 }}>{stats.sold}</span></span>
              <span style={{ color: "#10B981", fontWeight: 700 }}>+{stats.profit}€</span>
            </div>
          </div>
        ))}
      </Card>

      {/* Seller Type Analysis */}
      <Card>
        <SectionLabel>Verkäufertyp-Analyse</SectionLabel>
        {Object.entries(sellerStats).map(([type, stats]) => (
          <div key={type} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: "1px solid #ffffff06",
          }}>
            <SellerBadge type={type} />
            <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>Listings: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{stats.count}</span></span>
              <span style={{ color: "#64748b" }}>Ø Preis: <span style={{ color: "#F59E0B", fontWeight: 600 }}>{stats.avgPrice}€</span></span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function FlipFlowPro() {
  const [stage, setStage] = useState(STAGES.DASHBOARD);
  const [config, setConfig] = useState({
    platforms: ["kleinanzeigen", "ebay"], keywords: ["iPhone 14 Pro", "MacBook Air", "LEGO UCS"],
    categories: ["Elektronik", "Sammlerstücke"], sellerTypes: ["private_clear", "private"],
    minPrice: 30, maxPrice: 1200, minMargin: 20, location: "Berlin", radius: 80,
    refImages: [], autoContactThreshold: 80, maxParallelDeals: 8, resaleMarkup: 18,
  });
  const [listings, setListings] = useState([]);
  const [accounts, setAccounts] = useState([
    { id: "acc-1", platform: "kleinanzeigen", name: "einkauf_scout_01", purpose: "buy", email: "buy@mail.de", active: true },
    { id: "acc-2", platform: "ebay", name: "TechFlip_Verkauf", purpose: "sell", email: "sell@mail.de", active: true },
    { id: "acc-3", platform: "kleinanzeigen", name: "flip_verkauf_bln", purpose: "sell", email: "sell2@mail.de", active: true },
    { id: "acc-4", platform: "vinted", name: "vintage_deals_24", purpose: "both", email: "both@mail.de", active: true },
  ]);
  const [searching, setSearching] = useState(false);

  const startSearch = () => {
    setStage(STAGES.SEARCH);
    setSearching(true);
    setTimeout(() => { setListings(generateListings(config)); setSearching(false); }, 2800);
  };

  const navOrder = [STAGES.DASHBOARD, STAGES.ACCOUNTS, STAGES.SETUP, STAGES.SEARCH, STAGES.CLASSIFY, STAGES.REVIEW, STAGES.CONTACT, STAGES.PURCHASE, STAGES.RESALE, STAGES.ANALYTICS];
  const ci = navOrder.indexOf(stage);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #06060c 0%, #0a0a18 100%)", color: "#e2e8f0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #ffffff06", padding: "14px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#06060cee", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #F97316, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15, letterSpacing: "-0.03em" }}>FlipFlow Pro</div>
            <div style={{ fontSize: 10, color: "#475569" }}>Multi-Plattform Arbitrage Engine</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {Object.entries(PLATFORMS).slice(0, 4).map(([k, p]) => (
              <span key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: accounts.some(a => a.platform === k && a.active) ? p.color : "#333" }} />
            ))}
          </div>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B98166", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: "#10B981", fontWeight: 700 }}>LIVE</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 2, padding: "10px 16px", overflowX: "auto", borderBottom: "1px solid #ffffff05" }}>
        {navOrder.map((s, i) => {
          const m = STAGE_META[s];
          const isActive = stage === s;
          const canClick = s === STAGES.DASHBOARD || s === STAGES.ACCOUNTS || s === STAGES.ANALYTICS || i <= ci;
          return (
            <div key={s} onClick={() => canClick && setStage(s)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7,
              background: isActive ? m.color + "15" : "transparent",
              border: `1px solid ${isActive ? m.color + "33" : "transparent"}`,
              cursor: canClick ? "pointer" : "default",
              opacity: !canClick ? 0.25 : 1, whiteSpace: "nowrap", flexShrink: 0,
            }}>
              <span style={{ fontSize: 13 }}>{m.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? m.color : i < ci ? "#94a3b8" : "#475569" }}>{m.label}</span>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "20px 16px 60px" }}>
        {stage === STAGES.DASHBOARD && <DashboardStage listings={listings} accounts={accounts} onNavigate={setStage} />}
        {stage === STAGES.ACCOUNTS && <AccountsStage accounts={accounts} setAccounts={setAccounts} />}
        {stage === STAGES.SETUP && <SetupStage config={config} setConfig={setConfig} onNext={startSearch} />}
        {stage === STAGES.SEARCH && <SearchStage listings={listings} searching={searching} onClassify={() => setStage(STAGES.CLASSIFY)} />}
        {stage === STAGES.CLASSIFY && <ClassifyStage listings={listings} onReview={() => setStage(STAGES.REVIEW)} />}
        {stage === STAGES.REVIEW && <ReviewStage listings={listings} setListings={setListings} onContact={() => setStage(STAGES.CONTACT)} />}
        {stage === STAGES.CONTACT && <ContactStage listings={listings} setListings={setListings} accounts={accounts} onPurchase={() => setStage(STAGES.PURCHASE)} />}
        {stage === STAGES.PURCHASE && <PurchaseStage listings={listings} setListings={setListings} onResale={() => setStage(STAGES.RESALE)} />}
        {stage === STAGES.RESALE && <ResaleStage listings={listings} setListings={setListings} accounts={accounts} config={config} />}
        {stage === STAGES.ANALYTICS && <AnalyticsStage listings={listings} accounts={accounts} />}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ffffff12;border-radius:99px}`}</style>
    </div>
  );
}
