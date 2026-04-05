import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: "#06060c", color: "#e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          <div style={{ textAlign: "center", maxWidth: 420, padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Etwas ist schiefgelaufen</h1>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Ein unerwarteter Fehler ist aufgetreten. Deine Daten sind sicher im Browser gespeichert.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8,
                padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Neu laden
            </button>
            {this.state.error && (
              <details style={{ marginTop: 24, textAlign: "left" }}>
                <summary style={{ color: "#475569", fontSize: 12, cursor: "pointer" }}>Technische Details</summary>
                <pre style={{
                  marginTop: 8, padding: 12, background: "#0a0a15", borderRadius: 8,
                  fontSize: 11, color: "#EF4444", overflow: "auto", maxHeight: 120,
                  border: "1px solid #ffffff08",
                }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
