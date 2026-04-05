import { useState } from "react";

const PLATFORMS = [
  { name: "Kleinanzeigen", icon: "🟢", color: "#86BC25" },
  { name: "eBay", icon: "🔴", color: "#E53238" },
  { name: "Vinted", icon: "🟣", color: "#09B1BA" },
  { name: "FB Marketplace", icon: "🔵", color: "#1877F2" },
  { name: "Etsy", icon: "🟠", color: "#F56400" },
  { name: "reBuy", icon: "⚪", color: "#00A1E0" },
];

const FEATURES = [
  { icon: "🔍", title: "Multi-Plattform Scan", desc: "6 Plattformen gleichzeitig durchsuchen. Kein manuelles Wechseln mehr." },
  { icon: "🤖", title: "KI-Scoring", desc: "Automatische Bewertung jedes Listings nach Marge, Zustand & Verkäufertyp." },
  { icon: "📊", title: "Arbitrage-Rechner", desc: "Cross-Plattform Marge inkl. Gebühren in Echtzeit berechnet." },
  { icon: "👁", title: "HITL Review", desc: "Human-in-the-Loop — du entscheidest, die KI empfiehlt." },
  { icon: "✉", title: "Auto-Kontakt", desc: "Nachrichtenvorlagen pro Verkäufertyp. Ein Klick zum Absenden." },
  { icon: "💰", title: "Resale Pipeline", desc: "Vom Einkauf bis zum Verkauf — alles in einem Flow." },
];

const STEPS = [
  { num: "01", title: "Training", desc: "Plattformen, Kategorien, Keywords & Zielgruppe definieren." },
  { num: "02", title: "Scan", desc: "Automatischer Multi-Plattform Scan findet unterbewertete Listings." },
  { num: "03", title: "Score", desc: "KI bewertet jedes Listing — Marge, Zustand, Urgency." },
  { num: "04", title: "Deal", desc: "Review, Kontakt, Einkauf, Resale — alles in einem Workflow." },
];

export default function LandingPage({ onEnterToken, onAdminLogin }) {
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [adminError, setAdminError] = useState("");

  const handleToken = () => {
    if (!token.trim()) { setError("Bitte Token eingeben"); return; }
    const result = onEnterToken(token.trim());
    if (!result.valid) setError(result.reason);
  };

  const handleAdmin = () => {
    if (!adminPw.trim()) { setAdminError("Bitte Passwort eingeben"); return; }
    const result = onAdminLogin(adminPw);
    if (!result) setAdminError("Falsches Passwort");
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #06060c 0%, #0a0a18 50%, #06060c 100%)", color: "#e2e8f0", fontFamily: "'DM Sans', system-ui, sans-serif", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* ── NAV ── */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 32px", borderBottom: "1px solid #ffffff06",
        position: "sticky", top: 0, zIndex: 100, background: "#06060cee", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #F97316, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>⚡</div>
          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 17, letterSpacing: "-0.03em" }}>FlipFlow Pro</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setShowToken(true); setShowAdmin(false); }} style={{
            background: "transparent", color: "#94a3b8", border: "1px solid #ffffff15", borderRadius: 8,
            padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>Token eingeben</button>
          <button onClick={() => { setShowAdmin(true); setShowToken(false); }} style={{
            background: "linear-gradient(135deg, #F97316, #EC4899)", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>Admin Login</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ textAlign: "center", padding: "80px 24px 60px", maxWidth: 800, margin: "0 auto", position: "relative" }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, #F9731610 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "inline-flex", gap: 6, marginBottom: 24, padding: "6px 14px", background: "#F9731610", border: "1px solid #F9731622", borderRadius: 99 }}>
          <span style={{ fontSize: 12 }}>⚡</span>
          <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600 }}>Multi-Plattform Arbitrage Engine</span>
        </div>

        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 20px", fontFamily: "'Space Mono', monospace" }}>
          Finde. Kaufe.{" "}
          <span style={{ background: "linear-gradient(135deg, #F97316, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Verkaufe.
          </span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "#94a3b8", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 36px" }}>
          Scanne 6 Plattformen gleichzeitig. KI-Scoring bewertet jedes Listing.
          Cross-Plattform Arbitrage — vom Fund bis zum Verkauf in einem Flow.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => { setShowToken(true); setShowAdmin(false); }} style={{
            background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", borderRadius: 10,
            padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 24px #3B82F640",
          }}>Jetzt starten</button>
          <a href="#features" style={{
            background: "transparent", color: "#94a3b8", border: "1px solid #ffffff15", borderRadius: 10,
            padding: "14px 28px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            textDecoration: "none", display: "inline-block",
          }}>Features ansehen</a>
        </div>

        {/* Platform strip */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 48, flexWrap: "wrap" }}>
          {PLATFORMS.map(p => (
            <div key={p.name} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: p.color + "10", border: `1px solid ${p.color}22`, borderRadius: 8,
            }}>
              <span style={{ fontSize: 14 }}>{p.icon}</span>
              <span style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "60px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 40, fontFamily: "'Space Mono', monospace", letterSpacing: "-0.03em" }}>
          So funktioniert's
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {STEPS.map(s => (
            <div key={s.num} style={{
              background: "#12121e", border: "1px solid #ffffff08", borderRadius: 14, padding: 24,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -8, right: -4, fontSize: 64, fontWeight: 900,
                color: "#ffffff04", fontFamily: "'Space Mono', monospace", lineHeight: 1,
              }}>{s.num}</div>
              <div style={{ color: "#F97316", fontSize: 13, fontWeight: 800, fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
                Schritt {s.num}
              </div>
              <div style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "60px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 40, fontFamily: "'Space Mono', monospace", letterSpacing: "-0.03em" }}>
          Features
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: "#12121e", border: "1px solid #ffffff08", borderRadius: 14, padding: 24,
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: "60px 24px", maxWidth: 640, margin: "0 auto", textAlign: "center",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #12121e, #16213e)", border: "1px solid #3B82F622",
          borderRadius: 20, padding: "48px 32px",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>Bereit loszulegen?</h3>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Gib deinen Zugangs-Token ein oder kontaktiere den Admin für einen neuen Token.
          </p>
          <button onClick={() => { setShowToken(true); setShowAdmin(false); }} style={{
            background: "linear-gradient(135deg, #F97316, #EC4899)", color: "#fff", border: "none", borderRadius: 10,
            padding: "14px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>Token eingeben</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid #ffffff06", padding: "24px 32px", textAlign: "center",
        color: "#334155", fontSize: 12,
      }}>
        FlipFlow Pro v1.0 — Multi-Plattform Arbitrage Engine
      </footer>

      {/* ── TOKEN MODAL ── */}
      {showToken && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000cc", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
        }} onClick={(e) => e.target === e.currentTarget && setShowToken(false)}>
          <div style={{
            background: "#12121e", border: "1px solid #ffffff12", borderRadius: 16,
            padding: 32, width: "100%", maxWidth: 420, position: "relative",
          }}>
            <button onClick={() => setShowToken(false)} style={{
              position: "absolute", top: 12, right: 12, background: "transparent",
              border: "none", color: "#475569", fontSize: 18, cursor: "pointer",
            }}>×</button>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🔑</div>
            <h3 style={{ textAlign: "center", fontSize: 20, fontWeight: 700, marginBottom: 4, fontFamily: "'Space Mono', monospace" }}>Zugang</h3>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginBottom: 20 }}>
              Gib deinen persönlichen Zugangs-Token ein.
            </p>
            <input
              value={token} onChange={e => { setToken(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleToken()}
              placeholder="FF-XXXX-XXXX-XXXX"
              style={{
                width: "100%", background: "#0a0a15", border: `1px solid ${error ? "#EF444444" : "#ffffff12"}`,
                borderRadius: 10, padding: "14px 16px", color: "#e2e8f0", fontSize: 16,
                fontFamily: "'Space Mono', monospace", textAlign: "center", letterSpacing: "0.08em",
                outline: "none", boxSizing: "border-box",
              }}
            />
            {error && <div style={{ color: "#EF4444", fontSize: 12, textAlign: "center", marginTop: 8 }}>{error}</div>}
            <button onClick={handleToken} style={{
              width: "100%", marginTop: 16, background: "linear-gradient(135deg, #3B82F6, #6366F1)",
              color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 15,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>Zugang freischalten</button>
          </div>
        </div>
      )}

      {/* ── ADMIN MODAL ── */}
      {showAdmin && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000cc", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
        }} onClick={(e) => e.target === e.currentTarget && setShowAdmin(false)}>
          <div style={{
            background: "#12121e", border: "1px solid #ffffff12", borderRadius: 16,
            padding: 32, width: "100%", maxWidth: 420, position: "relative",
          }}>
            <button onClick={() => setShowAdmin(false)} style={{
              position: "absolute", top: 12, right: 12, background: "transparent",
              border: "none", color: "#475569", fontSize: 18, cursor: "pointer",
            }}>×</button>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🛡️</div>
            <h3 style={{ textAlign: "center", fontSize: 20, fontWeight: 700, marginBottom: 4, fontFamily: "'Space Mono', monospace" }}>Admin</h3>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginBottom: 20 }}>
              Master-Passwort eingeben um Tokens zu verwalten.
            </p>
            <input
              type="password" value={adminPw}
              onChange={e => { setAdminPw(e.target.value); setAdminError(""); }}
              onKeyDown={e => e.key === "Enter" && handleAdmin()}
              placeholder="Master-Passwort"
              style={{
                width: "100%", background: "#0a0a15", border: `1px solid ${adminError ? "#EF444444" : "#ffffff12"}`,
                borderRadius: 10, padding: "14px 16px", color: "#e2e8f0", fontSize: 15,
                fontFamily: "inherit", textAlign: "center", outline: "none", boxSizing: "border-box",
              }}
            />
            {adminError && <div style={{ color: "#EF4444", fontSize: 12, textAlign: "center", marginTop: 8 }}>{adminError}</div>}
            <button onClick={handleAdmin} style={{
              width: "100%", marginTop: 16, background: "linear-gradient(135deg, #F97316, #EC4899)",
              color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 15,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>Admin Login</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ffffff12;border-radius:99px}
      `}</style>
    </div>
  );
}
