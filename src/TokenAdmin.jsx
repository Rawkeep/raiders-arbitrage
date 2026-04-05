import { useState } from "react";
import { getStoredTokens, createToken, revokeToken, reactivateToken, deleteToken } from "./auth.js";

export default function TokenAdmin({ onBack }) {
  const [tokens, setTokens] = useState(getStoredTokens);
  const [newLabel, setNewLabel] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [copied, setCopied] = useState(null);

  const refresh = () => setTokens(getStoredTokens());

  const handleCreate = () => {
    const days = newExpiry ? parseInt(newExpiry, 10) : null;
    createToken(newLabel || "", days);
    setNewLabel("");
    setNewExpiry("");
    refresh();
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleRevoke = (id) => { revokeToken(id); refresh(); };
  const handleReactivate = (id) => { reactivateToken(id); refresh(); };
  const handleDelete = (id) => { deleteToken(id); refresh(); };

  const isExpired = (t) => t.expires && new Date(t.expires) < new Date();
  const activeCount = tokens.filter(t => t.active && !isExpired(t)).length;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #06060c 0%, #0a0a18 100%)", color: "#e2e8f0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #ffffff06", padding: "14px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#06060cee", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #F97316, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15 }}>FlipFlow Pro</div>
            <div style={{ fontSize: 10, color: "#F97316" }}>Admin — Token Management</div>
          </div>
        </div>
        <button onClick={onBack} style={{
          background: "transparent", color: "#94a3b8", border: "1px solid #ffffff15",
          borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>Zurück</button>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 60px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Gesamt", value: tokens.length, color: "#3B82F6" },
            { label: "Aktiv", value: activeCount, color: "#10B981" },
            { label: "Deaktiviert", value: tokens.length - activeCount, color: "#EF4444" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#12121e", border: "1px solid #ffffff08", borderRadius: 12,
              padding: 18, textAlign: "center",
            }}>
              <div style={{ color: s.color, fontSize: 28, fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Create Token */}
        <div style={{
          background: "#12121e", border: "1px solid #ffffff08", borderRadius: 14, padding: 20, marginBottom: 24,
        }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Neuen Token erstellen
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 10, alignItems: "end" }}>
            <div>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Label / Name</div>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="z.B. Max Mustermann"
                style={{
                  width: "100%", background: "#0a0a15", border: "1px solid #ffffff12",
                  borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13,
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }} />
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Ablauf (Tage)</div>
              <input type="number" value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
                placeholder="∞"
                style={{
                  width: "100%", background: "#0a0a15", border: "1px solid #ffffff12",
                  borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13,
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }} />
            </div>
            <button onClick={handleCreate} style={{
              background: "#10B981", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}>+ Token</button>
          </div>
        </div>

        {/* Token List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tokens.length === 0 && (
            <div style={{
              background: "#12121e", borderRadius: 14, padding: 48, textAlign: "center", color: "#475569",
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
              Noch keine Tokens erstellt. Erstelle den ersten Token oben.
            </div>
          )}
          {tokens.map(t => {
            const expired = isExpired(t);
            const statusColor = !t.active ? "#EF4444" : expired ? "#F59E0B" : "#10B981";
            const statusLabel = !t.active ? "Deaktiviert" : expired ? "Abgelaufen" : "Aktiv";
            return (
              <div key={t.id} style={{
                background: "#12121e", border: `1px solid ${statusColor}15`, borderRadius: 12,
                padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
                borderLeft: `3px solid ${statusColor}`,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <code style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700,
                      color: "#e2e8f0", letterSpacing: "0.04em",
                    }}>{t.id}</code>
                    <span style={{
                      background: statusColor + "18", color: statusColor, border: `1px solid ${statusColor}33`,
                      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                    }}>{statusLabel}</span>
                    {t.label && (
                      <span style={{ color: "#64748b", fontSize: 12 }}>{t.label}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "#475569" }}>
                    <span>Erstellt: {new Date(t.created).toLocaleDateString("de-DE")}</span>
                    {t.expires && <span>Ablauf: {new Date(t.expires).toLocaleDateString("de-DE")}</span>}
                    <span>Nutzungen: {t.uses || 0}</span>
                    {t.lastUsed && <span>Zuletzt: {new Date(t.lastUsed).toLocaleDateString("de-DE")}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, marginLeft: 12, flexShrink: 0 }}>
                  <button onClick={() => handleCopy(t.id)} title="Token kopieren" style={{
                    background: copied === t.id ? "#10B98120" : "#0a0a15", border: "1px solid #ffffff0a",
                    borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer",
                    color: copied === t.id ? "#10B981" : "#94a3b8", fontFamily: "inherit",
                  }}>{copied === t.id ? "✓" : "📋"}</button>
                  {t.active ? (
                    <button onClick={() => handleRevoke(t.id)} title="Deaktivieren" style={{
                      background: "#0a0a15", border: "1px solid #ffffff0a", borderRadius: 6,
                      padding: "6px 10px", fontSize: 12, cursor: "pointer", color: "#F59E0B", fontFamily: "inherit",
                    }}>⏸</button>
                  ) : (
                    <button onClick={() => handleReactivate(t.id)} title="Reaktivieren" style={{
                      background: "#0a0a15", border: "1px solid #ffffff0a", borderRadius: 6,
                      padding: "6px 10px", fontSize: 12, cursor: "pointer", color: "#10B981", fontFamily: "inherit",
                    }}>▶</button>
                  )}
                  <button onClick={() => handleDelete(t.id)} title="Löschen" style={{
                    background: "#0a0a15", border: "1px solid #ffffff0a", borderRadius: 6,
                    padding: "6px 10px", fontSize: 12, cursor: "pointer", color: "#EF4444", fontFamily: "inherit",
                  }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`*{box-sizing:border-box} ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#ffffff12;border-radius:99px}`}</style>
    </div>
  );
}
