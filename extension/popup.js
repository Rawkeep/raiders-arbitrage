// ─── FlipFlow Popup Logic ───

let capturedListings = [];

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const extractBtn = document.getElementById("extractBtn");
const sendBtn = document.getElementById("sendBtn");
const resultsDiv = document.getElementById("results");
const serverUrlInput = document.getElementById("serverUrl");

// Load saved server URL
chrome.storage.local.get(["flipflowServer"], (data) => {
  if (data.flipflowServer) serverUrlInput.value = data.flipflowServer;
});

serverUrlInput.addEventListener("change", () => {
  chrome.storage.local.set({ flipflowServer: serverUrlInput.value });
});

// Detect current tab platform
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || "";
  if (url.includes("kleinanzeigen.de")) {
    setStatus("green", "Kleinanzeigen erkannt");
  } else if (url.includes("vinted.")) {
    setStatus("green", "Vinted erkannt");
  } else if (url.includes("facebook.com/marketplace")) {
    setStatus("green", "FB Marketplace erkannt");
  } else {
    setStatus("red", "Keine unterstützte Seite");
    extractBtn.disabled = true;
    extractBtn.style.opacity = "0.4";
  }
});

function setStatus(color, text) {
  statusDot.className = `dot ${color}`;
  statusText.textContent = text;
}

// Extract
extractBtn.addEventListener("click", () => {
  extractBtn.textContent = "Erfasse...";
  extractBtn.disabled = true;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "extract" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        setStatus("red", "Fehler beim Erfassen");
        extractBtn.textContent = "Nochmal versuchen";
        extractBtn.disabled = false;
        return;
      }

      capturedListings = response.listings || [];
      setStatus("green", `${capturedListings.length} Listings gefunden`);
      extractBtn.textContent = `${capturedListings.length} Listings erfasst`;

      if (capturedListings.length > 0) {
        sendBtn.style.display = "block";
        renderResults();
      } else {
        resultsDiv.innerHTML = '<div class="msg">Keine Listings auf dieser Seite gefunden.</div>';
      }

      extractBtn.disabled = false;
    });
  });
});

// Send to FlipFlow
sendBtn.addEventListener("click", async () => {
  const serverUrl = serverUrlInput.value.replace(/\/$/, "");
  sendBtn.textContent = "Sende...";
  sendBtn.disabled = true;

  try {
    const res = await fetch(`${serverUrl}/api/import/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listings: capturedListings, config: {} }),
    });

    if (!res.ok) throw new Error(`Server: ${res.status}`);
    const data = await res.json();

    setStatus("green", `${data.imported} Listings importiert!`);
    sendBtn.textContent = "Gesendet ✓";
    sendBtn.className = "btn green";

    // Also save to extension storage for direct pickup by frontend
    chrome.storage.local.set({
      flipflowPending: capturedListings,
      flipflowTimestamp: Date.now(),
    });

  } catch (err) {
    setStatus("red", `Fehler: ${err.message}`);
    sendBtn.textContent = "Nochmal senden";
    sendBtn.disabled = false;
  }
});

function renderResults() {
  resultsDiv.innerHTML = capturedListings.map(item => `
    <div class="item">
      <span class="item-title" title="${item.title}">${item.title}</span>
      <span class="item-price">${item.price > 0 ? item.price + "€" : "—"}</span>
    </div>
  `).join("");
}
