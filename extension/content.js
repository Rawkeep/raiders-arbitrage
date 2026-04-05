// ─── FlipFlow Pro Content Script ───
// Erkennt Plattform, extrahiert Listings, sendet an FlipFlow

(function () {
  "use strict";

  const PLATFORM = detectPlatform();
  if (!PLATFORM) return;

  // ── Platform Detection ──
  function detectPlatform() {
    const host = location.hostname;
    if (host.includes("kleinanzeigen.de")) return "kleinanzeigen";
    if (host.includes("vinted.")) return "vinted";
    if (host.includes("facebook.com")) return "facebook";
    return null;
  }

  // ── Kleinanzeigen Parser ──
  function parseKleinanzeigen() {
    // Einzelanzeige
    const single = document.querySelector("[id='viewad-title']");
    if (single) {
      return [{
        title: single.textContent.trim(),
        price: parsePrice(document.querySelector("[id='viewad-price']")?.textContent),
        location: document.querySelector("[id='viewad-locality']")?.textContent?.trim() || "",
        sellerName: document.querySelector("[id='viewad-contact']")?.textContent?.trim()
          || document.querySelector(".userprofile-vip a")?.textContent?.trim() || "",
        description: document.querySelector("[id='viewad-description-text']")?.textContent?.trim() || "",
        imageUrl: document.querySelector("#viewad-image img")?.src
          || document.querySelector(".galleryimage img")?.src || "",
        itemUrl: location.href,
        condition: guessCondition(document.querySelector("[id='viewad-description-text']")?.textContent || ""),
        posted: document.querySelector("[id='viewad-extra-info'] span")?.textContent?.trim() || "",
        images: document.querySelectorAll(".galleryimage img, #viewad-image img").length,
        negotiable: (document.querySelector("[id='viewad-price']")?.textContent || "").includes("VB"),
        platform: "kleinanzeigen",
      }];
    }

    // Listenansicht
    const items = document.querySelectorAll("[data-adid], .aditem, article.aditem");
    return Array.from(items).map(el => ({
      title: el.querySelector(".text-module-begin a, .aditem-main--middle h2, .ellipsis")?.textContent?.trim() || "",
      price: parsePrice(el.querySelector(".aditem-main--middle--price, .aditem-main--middle--price-shipping--price")?.textContent),
      location: el.querySelector(".aditem-main--top--left, .aditem-main--top--left span")?.textContent?.trim() || "",
      sellerName: "",
      description: el.querySelector(".aditem-main--middle--description")?.textContent?.trim() || "",
      imageUrl: el.querySelector("img")?.src || "",
      itemUrl: el.querySelector("a[href*='/s-anzeige/']")?.href || el.querySelector("a")?.href || "",
      condition: "gut",
      posted: el.querySelector(".aditem-main--top--right")?.textContent?.trim() || "",
      images: 1,
      negotiable: (el.querySelector(".aditem-main--middle--price")?.textContent || "").includes("VB"),
      platform: "kleinanzeigen",
    })).filter(i => i.title);
  }

  // ── Vinted Parser ──
  function parseVinted() {
    // Einzelanzeige
    const single = document.querySelector("[data-testid='item-title'], .details-list--title");
    if (single && location.pathname.includes("/items/")) {
      return [{
        title: single.textContent.trim(),
        price: parsePrice(document.querySelector("[data-testid='item-price'], .details-list--price")?.textContent),
        location: document.querySelector("[data-testid='item-details-location']")?.textContent?.trim() || "",
        sellerName: document.querySelector("[data-testid='item-details-seller-name'] a, .details-list--info a")?.textContent?.trim() || "",
        description: document.querySelector("[data-testid='item-description'], .details-list--details")?.textContent?.trim() || "",
        imageUrl: document.querySelector("[data-testid='item-photo-0'] img, .item-photos img")?.src || "",
        itemUrl: location.href,
        condition: parseVintedCondition(document.querySelector("[data-testid='item-attributes-status']")?.textContent || ""),
        posted: "",
        images: document.querySelectorAll("[data-testid^='item-photo-'] img, .item-photos img").length,
        negotiable: false,
        platform: "vinted",
      }];
    }

    // Feed / Suche
    const items = document.querySelectorAll("[data-testid^='grid-item-'], .feed-grid__item, .ItemBox_container");
    return Array.from(items).map(el => ({
      title: el.querySelector("[data-testid$='-title'], .ItemBox_title, img")?.textContent?.trim()
        || el.querySelector("img")?.alt?.trim() || "",
      price: parsePrice(el.querySelector("[data-testid$='-price'], .ItemBox_price")?.textContent),
      location: "",
      sellerName: "",
      description: "",
      imageUrl: el.querySelector("img")?.src || "",
      itemUrl: el.querySelector("a")?.href || "",
      condition: "gut",
      posted: "",
      images: 1,
      negotiable: false,
      platform: "vinted",
    })).filter(i => i.title);
  }

  // ── Facebook Marketplace Parser ──
  function parseFacebook() {
    // Versuche Listings zu extrahieren — FB ändert DOM häufig
    const items = document.querySelectorAll("[data-testid='marketplace_feed_item'], a[href*='/marketplace/item/']");
    return Array.from(items).map(el => {
      const link = el.tagName === "A" ? el : el.querySelector("a[href*='/marketplace/item/']");
      const texts = Array.from(el.querySelectorAll("span")).map(s => s.textContent.trim()).filter(Boolean);
      const priceText = texts.find(t => /\d+\s*€|€\s*\d+|\$\s*\d+/.test(t)) || "";
      const title = texts.find(t => t.length > 10 && !t.includes("€") && !t.includes("$")) || texts[0] || "";

      return {
        title,
        price: parsePrice(priceText),
        location: texts.find(t => /\b(Berlin|Hamburg|München|Köln|Frankfurt)\b/i.test(t)) || "",
        sellerName: "",
        description: "",
        imageUrl: el.querySelector("img")?.src || "",
        itemUrl: link?.href || "",
        condition: "gut",
        posted: "",
        images: 1,
        negotiable: false,
        platform: "facebook",
      };
    }).filter(i => i.title);
  }

  // ── Helpers ──
  function parsePrice(text) {
    if (!text) return 0;
    const match = text.replace(/\./g, "").replace(",", ".").match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  function guessCondition(text) {
    const t = (text || "").toLowerCase();
    if (t.includes("neu") && (t.includes("ovp") || t.includes("original"))) return "neu";
    if (t.includes("wie neu") || t.includes("neuwertig")) return "wie-neu";
    if (t.includes("defekt") || t.includes("bastler") || t.includes("kaputt")) return "defekt";
    if (t.includes("gebraucht") || t.includes("gebrauchsspuren")) return "akzeptabel";
    return "gut";
  }

  function parseVintedCondition(text) {
    const t = (text || "").toLowerCase();
    if (t.includes("new") || t.includes("neu")) return "neu";
    if (t.includes("very good") || t.includes("sehr gut")) return "wie-neu";
    if (t.includes("good") || t.includes("gut")) return "gut";
    return "akzeptabel";
  }

  // ── Main: Extract & Communicate ──
  function extractListings() {
    switch (PLATFORM) {
      case "kleinanzeigen": return parseKleinanzeigen();
      case "vinted": return parseVinted();
      case "facebook": return parseFacebook();
      default: return [];
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "extract") {
      const listings = extractListings();
      sendResponse({ platform: PLATFORM, listings, url: location.href });
    }
    if (msg.action === "extractSingle") {
      const listings = extractListings();
      sendResponse({ platform: PLATFORM, listings: listings.slice(0, 1), url: location.href });
    }
    return true;
  });

  // Inject capture button on supported pages
  function injectCaptureButton() {
    if (document.getElementById("flipflow-capture-btn")) return;

    const btn = document.createElement("div");
    btn.id = "flipflow-capture-btn";
    btn.innerHTML = "⚡";
    btn.title = "An FlipFlow senden";
    btn.addEventListener("click", () => {
      const listings = extractListings();
      chrome.runtime.sendMessage({ action: "capture", listings, platform: PLATFORM });
      btn.innerHTML = "✓";
      btn.style.background = "#10B981";
      setTimeout(() => { btn.innerHTML = "⚡"; btn.style.background = "linear-gradient(135deg, #F97316, #EC4899)"; }, 1500);
    });
    document.body.appendChild(btn);
  }

  // Init after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectCaptureButton);
  } else {
    injectCaptureButton();
  }
})();
