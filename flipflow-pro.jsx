import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── PLATFORM CONFIG ───
const PLATFORMS = {
  instagram: { name: "Instagram", icon: "📸", color: "#E4405F", maxChars: 2200, hashtags: true },
  twitter: { name: "X / Twitter", icon: "𝕏", color: "#1DA1F2", maxChars: 280, hashtags: true },
  linkedin: { name: "LinkedIn", icon: "💼", color: "#0A66C2", maxChars: 3000, hashtags: true },
  tiktok: { name: "TikTok", icon: "🎵", color: "#FF0050", maxChars: 2200, hashtags: true },
  youtube: { name: "YouTube", icon: "▶️", color: "#FF0000", maxChars: 5000, hashtags: true },
  blog: { name: "Blog / SEO", icon: "📝", color: "#10B981", maxChars: 50000, hashtags: false },
  newsletter: { name: "Newsletter", icon: "📧", color: "#F59E0B", maxChars: 20000, hashtags: false },
  threads: { name: "Threads", icon: "🧵", color: "#000000", maxChars: 500, hashtags: true },
};

const TONES = {
  professional: { label: "Professional", icon: "👔", color: "#3B82F6", desc: "Seriös & kompetent" },
  casual: { label: "Casual", icon: "😎", color: "#10B981", desc: "Locker & nahbar" },
  witty: { label: "Witzig", icon: "😄", color: "#F59E0B", desc: "Humor & Charme" },
  inspirational: { label: "Inspirierend", icon: "✨", color: "#8B5CF6", desc: "Motivierend & visionär" },
  bold: { label: "Provokant", icon: "🔥", color: "#EF4444", desc: "Mutig & kontrovers" },
  storytelling: { label: "Storytelling", icon: "📖", color: "#EC4899", desc: "Narrative & Emotion" },
  educational: { label: "Educational", icon: "🎓", color: "#06B6D4", desc: "Lehrreich & wertvoll" },
  luxury: { label: "Premium", icon: "💎", color: "#D4AF37", desc: "Exklusiv & hochwertig" },
};

const CONTENT_TYPES = {
  social_post: { label: "Social Post", icon: "📱", color: "#E4405F" },
  thread: { label: "Thread / Carousel", icon: "🧵", color: "#1DA1F2" },
  blog_article: { label: "Blog-Artikel", icon: "📝", color: "#10B981" },
  ad_copy: { label: "Ad Copy", icon: "📢", color: "#F97316" },
  email: { label: "E-Mail / Newsletter", icon: "📧", color: "#F59E0B" },
  video_script: { label: "Video-Script", icon: "🎬", color: "#FF0050" },
  product_desc: { label: "Produktbeschreibung", icon: "🛍", color: "#8B5CF6" },
  hook: { label: "Hook / Headline", icon: "🎯", color: "#EF4444" },
};

const CATEGORIES = [
  "Tech & SaaS", "E-Commerce", "Personal Brand", "Fitness & Health",
  "Finance", "Food & Lifestyle", "Travel", "Education",
  "Real Estate", "Fashion & Beauty", "Coaching", "Startup",
];

const STAGES = {
  DASHBOARD: "dashboard",
  BRAND: "brand",
  STUDIO: "studio",
  TEMPLATES: "templates",
  EDITOR: "editor",
  MEDIA: "media",
  CALENDAR: "calendar",
  PUBLISH: "publish",
  ANALYTICS: "analytics",
};

const STAGE_META = {
  [STAGES.DASHBOARD]: { label: "Dashboard", icon: "⬡", color: "#e2e8f0" },
  [STAGES.BRAND]: { label: "Brand Voice", icon: "🎭", color: "#8B5CF6" },
  [STAGES.STUDIO]: { label: "AI Studio", icon: "🧠", color: "#3B82F6" },
  [STAGES.TEMPLATES]: { label: "Templates", icon: "📋", color: "#F59E0B" },
  [STAGES.EDITOR]: { label: "Editor", icon: "✏️", color: "#10B981" },
  [STAGES.MEDIA]: { label: "Media", icon: "🖼", color: "#EC4899" },
  [STAGES.CALENDAR]: { label: "Kalender", icon: "📅", color: "#06B6D4" },
  [STAGES.PUBLISH]: { label: "Publish", icon: "🚀", color: "#F97316" },
  [STAGES.ANALYTICS]: { label: "Analytics", icon: "📊", color: "#6366F1" },
};

// ─── AI CONTENT GENERATION (Mock) ───
const AI_HOOKS = [
  "Die meisten machen diesen Fehler...",
  "Ich habe 3 Jahre gebraucht, um das zu verstehen:",
  "Niemand spricht darüber, aber...",
  "Das hat alles verändert →",
  "Unpopular Opinion:",
  "Stopp. Lies das, bevor du weitermachst.",
  "In 30 Sekunden lernst du mehr als in 3 Monaten:",
  "Warum 99% scheitern (und wie du es anders machst):",
  "Der beste Rat, den ich je bekommen habe:",
  "Mein größter Fehler war...",
  "Das sagt dir niemand über Erfolg:",
  "5 Dinge, die ich gerne früher gewusst hätte:",
];

const AI_CTAS = [
  "💬 Was denkst du? Schreib's in die Kommentare!",
  "🔖 Speichere diesen Post für später!",
  "👉 Link in Bio für mehr",
  "↗️ Teile das mit jemandem, der es braucht",
  "🔔 Folge für mehr solche Inhalte",
  "💡 Welchen Tipp nutzt du schon?",
  "📩 Newsletter-Link in Bio",
  "🚀 Bereit für den nächsten Schritt?",
];

const AI_HASHTAG_POOLS = {
  "Tech & SaaS": ["#tech", "#saas", "#startup", "#coding", "#software", "#ai", "#digital", "#innovation", "#productivity", "#automation"],
  "E-Commerce": ["#ecommerce", "#onlineshop", "#dropshipping", "#amazon", "#shopify", "#business", "#entrepreneur", "#sales", "#marketing", "#passive"],
  "Personal Brand": ["#personalbranding", "#brand", "#mindset", "#growth", "#success", "#motivation", "#leadership", "#career", "#creator", "#influence"],
  "Fitness & Health": ["#fitness", "#health", "#workout", "#gym", "#nutrition", "#wellness", "#lifestyle", "#motivation", "#bodybuilding", "#healthy"],
  "Finance": ["#finance", "#investing", "#money", "#wealth", "#stocks", "#crypto", "#realestate", "#passive", "#financial", "#freedom"],
  default: ["#content", "#creator", "#viral", "#trending", "#fyp", "#inspo", "#tips", "#community", "#growth", "#follow"],
};

function generateAIContent(prompt, tone, contentType, platform, brandVoice, category) {
  const toneConfig = TONES[tone] || TONES.professional;
  const platConfig = PLATFORMS[platform] || PLATFORMS.instagram;

  const socialTemplates = {
    professional: [
      `${AI_HOOKS[Math.floor(Math.random() * AI_HOOKS.length)]}\n\nHier sind die 3 wichtigsten Erkenntnisse zu "${prompt}":\n\n1️⃣ Verstehe zuerst das Fundament — ohne Basis keine Skalierung.\n\n2️⃣ Fokussiere dich auf den Prozess, nicht auf das Ergebnis. Konsistenz schlägt Perfektion.\n\n3️⃣ Nutze Systeme statt Willenskraft. Automatisiere, was wiederholbar ist.\n\nDie erfolgreichsten ${category || "Professionals"} wissen: Es geht nicht um mehr Stunden, sondern um bessere Entscheidungen.\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
      `Ich habe in den letzten 12 Monaten intensiv an "${prompt}" gearbeitet.\n\nDas Ergebnis?\n→ 3x mehr Effizienz\n→ Weniger Stress\n→ Bessere Resultate\n\nDer Schlüssel war nicht härter arbeiten.\nSondern strategischer denken.\n\nHier ist mein Framework:\n\n📌 Schritt 1: Analyse — Was funktioniert wirklich?\n📌 Schritt 2: Eliminierung — Was kostet Zeit ohne Ergebnis?\n📌 Schritt 3: Optimierung — Wo ist der größte Hebel?\n\nDas Pareto-Prinzip funktioniert. Immer.\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
    ],
    casual: [
      `okay, real talk zu "${prompt}" 👇\n\nnicht alles was glänzt ist gold — das gilt besonders hier.\n\nich hab SO viel zeit verschwendet mit dem falschen ansatz. aber seit ich das hier mache, läuft's:\n\n✅ weniger overthinking, mehr doing\n✅ kleine schritte > große pläne\n✅ fehler = feedback, nicht versagen\n\nklingt simpel? ist es auch.\naber machen tut's trotzdem kaum jemand 🤷‍♂️\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
      `POV: du entdeckst "${prompt}" und plötzlich macht alles sinn 🤯\n\nnein aber ernsthaft — das ist so underrated.\n\ndie meisten leute da draußen schlafen komplett drauf.\nund genau DAS ist deine chance.\n\nwas ich damit meine:\n→ Der Markt ist da\n→ Die Tools sind da\n→ Du musst nur anfangen\n\nstop scrolling. start building. 🚀\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
    ],
    witty: [
      `"${prompt}" klingt langweilig?\n\nDas haben sie auch über Netflix, Bitcoin und Hafermilch gesagt. 😏\n\nFun Fact: Die langweiligsten Themen machen die besten Businesses.\n\nWarum?\n→ Wenig Competition (weil alle "sexy" Themen wollen)\n→ Echte Probleme = zahlende Kunden\n→ Langweilig für andere = Goldgrube für dich\n\nAlso wenn das nächste Mal jemand gähnt bei deiner Idee: Gratulation. Du bist auf dem richtigen Weg. 🎉\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
    ],
    inspirational: [
      `Die Wahrheit über "${prompt}":\n\nJeder Experte war mal ein Anfänger.\nJeder Profi hat mal gezweifelt.\nJedes erfolgreiche Business hatte einen Tag 1.\n\n✨ Du bist genau da, wo du sein sollst.\n\nDer einzige Unterschied zwischen dir und den Menschen, die du bewunderst?\n\nSie haben nicht aufgehört.\n\nAlso: Mach weiter. Lern weiter. Wachse weiter.\nDein Future Self wird dir danken. 🙏\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
    ],
    bold: [
      `90% der Ratschläge zu "${prompt}" sind Bullshit.\n\nDa, ich hab's gesagt. 🔥\n\nDie Wahrheit, die keiner hören will:\n\n❌ Es gibt keine Abkürzung\n❌ Overnight Success existiert nicht\n❌ Fake Gurus verkaufen Träume, keine Ergebnisse\n\nWas wirklich funktioniert?\n\n✅ Brutal ehrlich sein — zu dir selbst\n✅ Execution > Strategy\n✅ 1000 Tage Konsistenz > 1 viraler Post\n\nHört auf, nach dem "Secret" zu suchen.\nDas Secret ist: Es gibt keins.\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
    ],
    storytelling: [
      `Vor 2 Jahren stand ich mit "${prompt}" am Nullpunkt.\n\nKein Plan. Kein Netzwerk. Kein Budget.\nNur eine Idee und die Überzeugung, dass es funktionieren muss.\n\nDie ersten 3 Monate? Stille.\nKein Like, kein Kommentar, kein Kunde.\n\nIch wollte aufhören. Ernsthaft.\n\nAber dann kam dieser eine Moment...\n\nEine Nachricht: "Dein Content hat mir geholfen, den ersten Schritt zu machen."\n\nDAS war der Wendepunkt.\nNicht die Zahlen. Nicht das Geld.\nSondern der Impact.\n\nHeute? Tausende Menschen erreicht. Und es fing mit EINER Person an.\n\nDeine Story startet jetzt. 💫\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
    ],
    educational: [
      `${prompt} — einfach erklärt 🎓\n\nViele verkomplizieren das Thema. Hier ist die Simple-Version:\n\n📘 Was ist es?\nKurz: Ein System, das dir hilft, [Ergebnis] zu erreichen — ohne [typisches Problem].\n\n📘 Warum ist es wichtig?\nWeil 80% der Leute immer noch [veraltete Methode] nutzen. Das kostet Zeit UND Geld.\n\n📘 Wie startest du?\n1. Definiere dein Ziel (spezifisch!)\n2. Wähle EIN Tool / EINE Methode\n3. Setze um — 30 Min pro Tag reicht\n4. Messe nach 14 Tagen\n5. Optimiere basierend auf Daten\n\n📘 Pro-Tipp:\nStarte mit dem kleinsten möglichen Schritt. Perfektion kommt mit der Übung.\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
    ],
    luxury: [
      `Exzellenz in "${prompt}" — das unterscheidet die Top 1%\n\n◆ Sie investieren in Qualität, nicht Quantität\n◆ Sie optimieren Systeme, nicht Arbeitsstunden\n◆ Sie denken in Dekaden, nicht in Quartalen\n\nDie Details machen den Unterschied.\nDie Extra-Meile ist nie überfüllt.\n\nPremium ist keine Preiskategorie.\nEs ist eine Denkweise.\n\n${AI_CTAS[Math.floor(Math.random() * AI_CTAS.length)]}`,
    ],
  };

  const blogTemplates = [
    `# ${prompt}: Der ultimative Guide ${new Date().getFullYear()}\n\n## Einleitung\n\nIn einer Welt, die sich schneller dreht als je zuvor, ist "${prompt}" nicht mehr optional — es ist essentiell. Ob du gerade erst anfängst oder bereits Erfahrung hast: Dieser Guide gibt dir das Framework, das wirklich funktioniert.\n\n## Warum ${prompt} jetzt wichtig ist\n\nDie Zahlen sprechen für sich:\n- 73% der erfolgreichen Unternehmen setzen bereits darauf\n- Der Markt wächst jährlich um 35%\n- Early Adopters berichten von 2-5x ROI\n\n## Die 5 Säulen des Erfolgs\n\n### 1. Fundament legen\nBevor du loslegst, brauchst du Klarheit über dein Ziel. Nicht "mehr Umsatz" — sondern: "25% mehr qualifizierte Leads in Q3 durch organischen Content."\n\n### 2. Strategie vor Taktik\nEin Post pro Tag bringt nichts, wenn die Strategie fehlt. Definiere erst: Wer ist deine Zielgruppe? Was ist deren größter Pain Point? Wie löst du ihn?\n\n### 3. Content-System aufbauen\nErfolgreiche Creator arbeiten mit Systemen:\n- Content-Pillar-Strategie (3-5 Kernthemen)\n- Batch-Production (1 Tag produzieren → 1 Woche posten)\n- Repurposing (1 Longform → 10+ Shortform Pieces)\n\n### 4. Distribution ist King\nDer beste Content nützt nichts ohne Reichweite. Nutze:\n- SEO-Optimierung für organischen Traffic\n- Cross-Posting auf relevanten Plattformen\n- Community-Building für nachhaltiges Wachstum\n\n### 5. Daten-getrieben optimieren\nMiss, was funktioniert. Nicht Vanity Metrics (Likes), sondern Impact Metrics (Conversions, Saves, Shares).\n\n## Fazit\n\n${prompt} ist kein Sprint — es ist ein Marathon. Aber mit dem richtigen System und der richtigen Denkweise wirst du Ergebnisse sehen, die sich exponentiell entwickeln.\n\nStarte heute. Optimiere morgen. Skaliere übermorgen.\n\n---\n*Dieser Artikel wurde mit KI-Unterstützung erstellt und redaktionell überarbeitet.*`,
  ];

  const emailTemplates = [
    `Betreff: ${prompt} — das musst du wissen\n\nHey [Name],\n\nich wollte kurz was mit dir teilen, das einen echten Unterschied machen kann.\n\nLetzte Woche habe ich intensiv an "${prompt}" gearbeitet und dabei 3 Dinge entdeckt, die mir vorher komplett entgangen sind:\n\n💡 Erkenntnis 1:\nDie meisten unterschätzen den Compound-Effekt. Kleine, konsistente Schritte > große, sporadische Aktionen.\n\n💡 Erkenntnis 2:\nDas richtige Timing macht 40% des Erfolgs aus. Nicht alles funktioniert zu jeder Zeit gleich gut.\n\n💡 Erkenntnis 3:\nCommunity schlägt Reichweite. 100 engagierte Follower > 10.000 passive.\n\nIch habe dazu einen ausführlichen Guide geschrieben:\n→ [LINK]\n\nWürde mich freuen, wenn du reinschaust und mir sagst, was du davon hältst.\n\nBis bald,\n[Dein Name]\n\nP.S. Nächste Woche kommt Teil 2 — mit konkreten Vorlagen zum Sofort-Umsetzen. Stay tuned! 🚀`,
  ];

  const videoScriptTemplates = [
    `🎬 VIDEO-SCRIPT: "${prompt}"\n━━━━━━━━━━━━━━━━━━━━━━━\n\n📍 HOOK (0:00 - 0:03)\n"${AI_HOOKS[Math.floor(Math.random() * AI_HOOKS.length)]}"\n[Direkt in die Kamera, energisch]\n\n📍 PROBLEM (0:03 - 0:15)\n"Die meisten Leute machen bei ${prompt} einen entscheidenden Fehler. Sie denken, es reicht, einfach [häufiger Fehler]. Aber das ist genau der Grund, warum 90% stagnieren."\n[B-Roll: frustrierte Person am Laptop]\n\n📍 LÖSUNG (0:15 - 0:45)\n"Was stattdessen funktioniert — und das sage ich nach [Zeitraum] Erfahrung:\n\nSchritt 1: [Konkreter Schritt]\nSchritt 2: [Konkreter Schritt]\nSchritt 3: [Konkreter Schritt]"\n[Screen-Recording / Grafik einblenden]\n\n📍 BEWEIS (0:45 - 1:00)\n"Seit ich das mache, habe ich [konkretes Ergebnis]. Und das Beste: Es hat nur [Zeitaufwand] gedauert."\n[Screenshots / Zahlen einblenden]\n\n📍 CTA (1:00 - 1:10)\n"Wenn du mehr solche Tipps willst: Folge mir und aktiviere die Glocke. Und schreib mir in die Kommentare: Was ist DEINE größte Herausforderung bei ${prompt}?"\n[Text-Overlay: FOLGEN + 🔔]\n\n━━━━━━━━━━━━━━━━━━━━━━━\n📊 Geschätzte Länge: 60-70 Sekunden\n🎯 Zielplattform: TikTok / Reels / Shorts`,
  ];

  const adCopyTemplates = [
    `🎯 AD COPY — "${prompt}"\n━━━━━━━━━━━━━━━━━━━━\n\n📌 HEADLINE:\n"${prompt}: In 30 Tagen von 0 auf Ergebnis"\n\n📌 PRIMARY TEXT:\nDu willst ${prompt} endlich richtig umsetzen?\n\n→ Ohne monatelanges Trial & Error\n→ Ohne teure Berater\n→ Ohne den ganzen Overhead\n\nUnser bewährtes System hat bereits 500+ Menschen geholfen.\n\n✅ Schritt-für-Schritt Anleitung\n✅ Persönlicher Support\n✅ 30-Tage Geld-zurück-Garantie\n\n📌 CTA: Jetzt kostenlos starten →\n\n📌 DESCRIPTION:\nDas #1 System für ${prompt}. Starte heute kostenlos.\n\n━━━━━━━━━━━━━━━━━━━━\n📊 Variante A (Emotional) | Variante B (Rational)\nA/B Test empfohlen`,
  ];

  const threadTemplates = [
    `🧵 THREAD: "${prompt}" — ein deep dive\n\n━━ Post 1/7 ━━\n${AI_HOOKS[Math.floor(Math.random() * AI_HOOKS.length)]}\n\nIch habe ${prompt} bis ins Detail analysiert.\n\nHier sind meine Erkenntnisse (thread 🧵👇)\n\n━━ Post 2/7 ━━\nZuerst: Warum ist ${prompt} überhaupt relevant?\n\n→ Der Markt explodiert\n→ Frühe Mover haben massive Vorteile\n→ Die Eintrittsbarriere ist noch niedrig\n\nAber die meisten verpassen das Fenster.\n\n━━ Post 3/7 ━━\nDer #1 Fehler:\n\nAlle wollen direkt "skalieren" — ohne das Fundament zu haben.\n\nDas ist wie ein Haus ohne Fundament bauen.\nSieht kurz gut aus. Dann kracht's.\n\n━━ Post 4/7 ━━\nWas stattdessen funktioniert:\n\n1️⃣ Verstehe deine Zielgruppe (wirklich!)\n2️⃣ Löse EIN Problem richtig gut\n3️⃣ Baue Systeme, nicht Kampagnen\n4️⃣ Messe Impact, nicht Vanity Metrics\n\n━━ Post 5/7 ━━\nMein persönliches Framework:\n\n📌 Montag: Recherche & Ideation\n📌 Di-Mi: Content Produktion\n📌 Donnerstag: Distribution & Engagement\n📌 Freitag: Analyse & Optimierung\n📌 Wochenende: Community & Networking\n\n━━ Post 6/7 ━━\nTools, die ich nutze:\n\n→ [Tool 1] für Content Creation\n→ [Tool 2] für Scheduling\n→ [Tool 3] für Analytics\n→ [Tool 4] für Automatisierung\n\nAlle Links gesammelt: [Link in Bio]\n\n━━ Post 7/7 ━━\nZusammenfassung:\n\n${prompt} ist kein Hype — es ist eine Chance.\n\nAber nur für die, die JETZT handeln.\n\n♻️ Reposte den Thread, wenn er hilfreich war\n🔔 Folge für mehr solche Deep Dives\n💬 Fragen? Ab in die Kommentare!`,
  ];

  if (contentType === "blog_article") return blogTemplates[0];
  if (contentType === "email") return emailTemplates[0];
  if (contentType === "video_script") return videoScriptTemplates[0];
  if (contentType === "ad_copy") return adCopyTemplates[0];
  if (contentType === "thread") return threadTemplates[0];

  const pool = socialTemplates[tone] || socialTemplates.professional;
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateHashtags(category, count = 12) {
  const pool = AI_HASHTAG_POOLS[category] || AI_HASHTAG_POOLS.default;
  const extra = AI_HASHTAG_POOLS.default;
  const combined = [...new Set([...pool, ...extra])];
  return combined.sort(() => Math.random() - 0.5).slice(0, count);
}

// ─── SHARED UI ───
const inputStyle = {
  background: "#0a0a15", border: "1px solid #ffffff12", borderRadius: 8,
  padding: "10px 14px", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit",
  outline: "none", width: "100%", boxSizing: "border-box",
};

const textareaStyle = {
  ...inputStyle, resize: "vertical", minHeight: 80, lineHeight: 1.6,
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

function Btn({ label, onClick, variant = "primary", icon, disabled, small, style: extraStyle = {} }) {
  const colors = {
    primary: "#3B82F6", approve: "#10B981", reject: "#EF4444",
    warn: "#F59E0B", ghost: "transparent", sell: "#F97316",
    purple: "#8B5CF6", pink: "#EC4899", cyan: "#06B6D4",
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
      ...extraStyle,
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

function SectionLabel({ children }) {
  return (
    <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
      {children}
    </label>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <Card style={{ textAlign: "center", padding: 16 }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ color, fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{label}</div>
    </Card>
  );
}

// ─── TYPEWRITER HOOK ───
function useTypewriter(text, speed = 12) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) { setDisplayed(""); setDone(false); return; }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(timer); setDone(true); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return { displayed, done };
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
function DashboardStage({ contents, brandVoice, onNavigate }) {
  const total = contents.length;
  const published = contents.filter(c => c.status === "published").length;
  const scheduled = contents.filter(c => c.status === "scheduled").length;
  const drafts = contents.filter(c => c.status === "draft").length;
  const totalReach = contents.filter(c => c.status === "published").reduce((s, c) => s + (c.reach || 0), 0);
  const totalEngagement = contents.filter(c => c.status === "published").reduce((s, c) => s + (c.engagement || 0), 0);

  const platformCounts = {};
  contents.forEach(c => {
    (c.platforms || []).forEach(p => { platformCounts[p] = (platformCounts[p] || 0) + 1; });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, color: "#e2e8f0", fontFamily: "'Space Mono', monospace", letterSpacing: "-0.03em" }}>
          ⬡ Content Command Center
        </h2>
        <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>
          KI-gestütztes Content-Management — Erstellen · Planen · Publishen · Analysieren
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard icon="📝" value={total} label="Gesamt Content" color="#3B82F6" />
        <StatCard icon="🚀" value={published} label="Veröffentlicht" color="#10B981" />
        <StatCard icon="📅" value={scheduled} label="Geplant" color="#06B6D4" />
        <StatCard icon="📊" value={totalReach > 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach} label="Reichweite" color="#8B5CF6" />
      </div>

      {/* Brand Voice Status */}
      <Card glow={brandVoice.name ? "#8B5CF6" : "#F59E0B"} style={{ borderLeft: `3px solid ${brandVoice.name ? "#8B5CF6" : "#F59E0B"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 24 }}>🎭</span>
            <div>
              <div style={{ color: brandVoice.name ? "#8B5CF6" : "#F59E0B", fontWeight: 700, fontSize: 14 }}>
                {brandVoice.name ? `Brand Voice: ${brandVoice.name}` : "Brand Voice nicht konfiguriert"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                {brandVoice.name
                  ? `Tone: ${TONES[brandVoice.defaultTone]?.label || "—"} · Nische: ${brandVoice.niche || "—"}`
                  : "Konfiguriere deine Brand Voice für bessere KI-Ergebnisse"
                }
              </div>
            </div>
          </div>
          <Btn label={brandVoice.name ? "Bearbeiten" : "Einrichten"} icon="🎭" variant={brandVoice.name ? "ghost" : "purple"} onClick={() => onNavigate(STAGES.BRAND)} small />
        </div>
      </Card>

      {/* Platform Overview */}
      <Card>
        <SectionLabel>Plattform-Übersicht</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {Object.entries(PLATFORMS).map(([key, p]) => {
            const count = platformCounts[key] || 0;
            return (
              <div key={key} style={{
                background: "#0a0a15", borderRadius: 10, padding: 14,
                border: `1px solid ${p.color}22`, display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.icon} {p.name}</span>
                </div>
                <div style={{ color: "#475569", fontSize: 11 }}>
                  {count} Posts · {p.maxChars} Zeichen max
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        {[
          { stage: STAGES.STUDIO, icon: "🧠", label: "AI Studio", desc: "Content erstellen", color: "#3B82F6" },
          { stage: STAGES.TEMPLATES, icon: "📋", label: "Templates", desc: "Vorlagen nutzen", color: "#F59E0B" },
          { stage: STAGES.CALENDAR, icon: "📅", label: "Kalender", desc: "Content planen", color: "#06B6D4" },
          { stage: STAGES.ANALYTICS, icon: "📊", label: "Analytics", desc: "Performance", color: "#6366F1" },
        ].map(item => (
          <Card key={item.stage} onClick={() => onNavigate(item.stage)} style={{ cursor: "pointer", textAlign: "center", padding: 20 }} glow={item.color}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ color: item.color, fontWeight: 700, fontSize: 14 }}>{item.label}</div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{item.desc}</div>
          </Card>
        ))}
      </div>

      {/* Recent Content */}
      {contents.length > 0 && (
        <Card>
          <SectionLabel>Letzte Inhalte</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {contents.slice(0, 6).map(item => (
              <div key={item.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", background: "#0a0a15", borderRadius: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 16 }}>{CONTENT_TYPES[item.contentType]?.icon || "📝"}</span>
                  <span style={{ color: "#e2e8f0", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title || item.prompt}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {(item.platforms || []).slice(0, 3).map(p => (
                    <span key={p} style={{ fontSize: 12 }}>{PLATFORMS[p]?.icon}</span>
                  ))}
                  <Badge color={
                    item.status === "published" ? "#10B981" :
                    item.status === "scheduled" ? "#06B6D4" : "#475569"
                  }>{item.status === "published" ? "Live" : item.status === "scheduled" ? "Geplant" : "Entwurf"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Tip */}
      <Card glow="#3B82F6" style={{ borderLeft: "3px solid #3B82F6" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <div>
            <div style={{ color: "#3B82F6", fontWeight: 700, fontSize: 13 }}>AI-Tipp des Tages</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              Content mit Storytelling-Elementen erzielt durchschnittlich 3x mehr Engagement als reine Info-Posts.
              Starte deinen nächsten Post mit einer persönlichen Geschichte — die KI hilft dir dabei im AI Studio.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════
// BRAND VOICE
// ═══════════════════════════════════════
function BrandStage({ brandVoice, setBrandVoice }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, color: "#8B5CF6", fontFamily: "'Space Mono', monospace" }}>🎭 Brand Voice Training</h2>
        <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>
          Trainiere die KI auf deine Markenidentität — Ton, Stil, Werte, Zielgruppe.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionLabel>Markenname / Persona</SectionLabel>
          <input value={brandVoice.name} onChange={e => setBrandVoice(v => ({ ...v, name: e.target.value }))}
            placeholder="z.B. MaxMustermann, TechFlow, ..." style={inputStyle} />
          <div style={{ height: 16 }} />
          <SectionLabel>Nische / Branche</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORIES.map(cat => (
              <span key={cat} onClick={() => setBrandVoice(v => ({ ...v, niche: cat }))}
                style={{
                  background: brandVoice.niche === cat ? "#8B5CF618" : "#0a0a15",
                  color: brandVoice.niche === cat ? "#8B5CF6" : "#475569",
                  border: `1px solid ${brandVoice.niche === cat ? "#8B5CF633" : "#ffffff08"}`,
                  padding: "7px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontWeight: 500,
                }}>{cat}</span>
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>Standard-Tonalität</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(TONES).map(([key, t]) => (
              <div key={key} onClick={() => setBrandVoice(v => ({ ...v, defaultTone: key }))}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8,
                  background: brandVoice.defaultTone === key ? t.color + "12" : "#0a0a15",
                  border: `1px solid ${brandVoice.defaultTone === key ? t.color + "44" : "#ffffff08"}`,
                  cursor: "pointer",
                }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <div>
                  <div style={{ color: brandVoice.defaultTone === key ? t.color : "#94a3b8", fontWeight: 700, fontSize: 13 }}>{t.label}</div>
                  <div style={{ color: "#475569", fontSize: 11 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Target Audience */}
      <Card>
        <SectionLabel>Zielgruppe</SectionLabel>
        <textarea value={brandVoice.audience || ""} onChange={e => setBrandVoice(v => ({ ...v, audience: e.target.value }))}
          placeholder="Beschreibe deine Zielgruppe — z.B. Unternehmer 25-40, tech-affin, wollen ihren Content skalieren..."
          style={textareaStyle} />
      </Card>

      {/* Brand Keywords */}
      <Card>
        <SectionLabel>Markenwerte & Keywords</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="z.B. Innovation, Qualität, Authentizität..." style={{ ...inputStyle, flex: 1 }}
            onKeyDown={e => {
              if (e.key === "Enter" && e.target.value.trim()) {
                setBrandVoice(v => ({ ...v, keywords: [...new Set([...(v.keywords || []), e.target.value.trim()])] }));
                e.target.value = "";
              }
            }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {(brandVoice.keywords || []).map(k => (
            <span key={k} onClick={() => setBrandVoice(v => ({ ...v, keywords: (v.keywords || []).filter(x => x !== k) }))}
              style={{ background: "#8B5CF614", color: "#8B5CF6", border: "1px solid #8B5CF633",
                padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              {k} ×
            </span>
          ))}
        </div>
      </Card>

      {/* Dos and Don'ts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card glow="#10B981">
          <SectionLabel>✅ DOs — Die KI soll...</SectionLabel>
          <textarea value={brandVoice.dos || ""} onChange={e => setBrandVoice(v => ({ ...v, dos: e.target.value }))}
            placeholder="z.B. Du-Form verwenden, Emojis einsetzen, mit Hook starten, CTA am Ende..."
            style={{ ...textareaStyle, minHeight: 100 }} />
        </Card>
        <Card glow="#EF4444">
          <SectionLabel>❌ DON'Ts — Die KI soll NICHT...</SectionLabel>
          <textarea value={brandVoice.donts || ""} onChange={e => setBrandVoice(v => ({ ...v, donts: e.target.value }))}
            placeholder="z.B. Keine Clickbait-Titel, kein Fachjargon, nicht 'wir' verwenden, keine Floskeln..."
            style={{ ...textareaStyle, minHeight: 100 }} />
        </Card>
      </div>

      {/* Example Content */}
      <Card>
        <SectionLabel>Referenz-Content (Optional)</SectionLabel>
        <textarea value={brandVoice.examples || ""} onChange={e => setBrandVoice(v => ({ ...v, examples: e.target.value }))}
          placeholder="Füge hier Beispiel-Posts ein, die deinen Stil widerspiegeln. Die KI lernt daraus."
          style={{ ...textareaStyle, minHeight: 120 }} />
      </Card>

      {/* Preview */}
      {brandVoice.name && (
        <Card glow="#8B5CF6">
          <SectionLabel>Brand Voice Zusammenfassung</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <div><div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase" }}>Name</div><div style={{ color: "#e2e8f0", fontWeight: 700, marginTop: 2 }}>{brandVoice.name}</div></div>
            <div><div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase" }}>Nische</div><div style={{ color: "#8B5CF6", fontWeight: 700, marginTop: 2 }}>{brandVoice.niche || "—"}</div></div>
            <div><div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase" }}>Tone</div><div style={{ color: TONES[brandVoice.defaultTone]?.color || "#94a3b8", fontWeight: 700, marginTop: 2 }}>{TONES[brandVoice.defaultTone]?.label || "—"} {TONES[brandVoice.defaultTone]?.icon}</div></div>
          </div>
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#0a0a15", borderRadius: 8, color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>
            KI generiert Content als <strong style={{ color: "#8B5CF6" }}>{brandVoice.name}</strong> in der Nische <strong style={{ color: "#8B5CF6" }}>{brandVoice.niche || "—"}</strong> mit {TONES[brandVoice.defaultTone]?.label || "—"} Tonalität.
            {brandVoice.audience && <> Zielgruppe: {brandVoice.audience.slice(0, 100)}...</>}
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// AI STUDIO
// ═══════════════════════════════════════
function StudioStage({ brandVoice, onContentCreated, onNavigateEditor }) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState(brandVoice.defaultTone || "professional");
  const [contentType, setContentType] = useState("social_post");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["instagram"]);
  const [category, setCategory] = useState(brandVoice.niche || "");
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [variations, setVariations] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { displayed, done } = useTypewriter(generating ? "" : generatedText, 8);

  const generate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGeneratedText("");
    setVariations([]);
    setHashtags([]);
    setTimeout(() => {
      const text = generateAIContent(prompt, tone, contentType, selectedPlatforms[0], brandVoice, category);
      setGeneratedText(text);
      setHashtags(generateHashtags(category || brandVoice.niche));
      setGenerating(false);
    }, 1500 + Math.random() * 1000);
  };

  const generateVariations = () => {
    const vars = [];
    for (let i = 0; i < 3; i++) {
      const randomTone = Object.keys(TONES)[Math.floor(Math.random() * Object.keys(TONES).length)];
      vars.push({
        id: `var-${Date.now()}-${i}`,
        tone: randomTone,
        text: generateAIContent(prompt, randomTone, contentType, selectedPlatforms[0], brandVoice, category).slice(0, 200) + "...",
      });
    }
    setVariations(vars);
  };

  const saveContent = () => {
    if (!generatedText) return;
    onContentCreated({
      id: `content-${Date.now()}`,
      prompt, tone, contentType,
      platforms: selectedPlatforms,
      category, text: generatedText,
      hashtags, title: prompt.slice(0, 60),
      status: "draft",
      createdAt: new Date().toISOString(),
      reach: 0, engagement: 0,
      wordCount: generatedText.split(/\s+/).length,
      charCount: generatedText.length,
    });
    onNavigateEditor();
  };

  const togglePlatform = (key) => {
    setSelectedPlatforms(ps =>
      ps.includes(key) ? ps.filter(p => p !== key) : [...ps, key]
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, color: "#3B82F6", fontFamily: "'Space Mono', monospace" }}>🧠 AI Content Studio</h2>
        <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>
          Beschreibe dein Thema — die KI erstellt optimierten Content für deine Plattformen.
        </p>
      </div>

      {/* Main Prompt */}
      <Card glow="#3B82F6">
        <SectionLabel>Worum geht's?</SectionLabel>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="z.B. 'Warum Content Marketing 2025 wichtiger ist als je zuvor' oder 'Die 5 größten Fehler beim Personal Branding' ..."
          style={{ ...textareaStyle, minHeight: 100, fontSize: 15, border: "1px solid #3B82F633" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ color: "#475569", fontSize: 11 }}>{prompt.length} Zeichen</span>
          <span style={{ color: "#475569", fontSize: 11, cursor: "pointer" }} onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? "▲ Weniger Optionen" : "▼ Mehr Optionen"}
          </span>
        </div>
      </Card>

      {/* Content Type */}
      <Card>
        <SectionLabel>Content-Typ</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {Object.entries(CONTENT_TYPES).map(([key, ct]) => (
            <div key={key} onClick={() => setContentType(key)} style={{
              background: contentType === key ? ct.color + "12" : "#0a0a15",
              border: `1px solid ${contentType === key ? ct.color + "44" : "#ffffff08"}`,
              borderRadius: 10, padding: 12, cursor: "pointer", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{ct.icon}</div>
              <div style={{ color: contentType === key ? ct.color : "#94a3b8", fontWeight: 700, fontSize: 11 }}>{ct.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tone */}
      <Card>
        <SectionLabel>Tonalität</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(TONES).map(([key, t]) => (
            <span key={key} onClick={() => setTone(key)} style={{
              background: tone === key ? t.color + "20" : "#0a0a15",
              color: tone === key ? t.color : "#475569",
              border: `1px solid ${tone === key ? t.color + "44" : "#ffffff0a"}`,
              padding: "8px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
            </span>
          ))}
        </div>
      </Card>

      {/* Platforms */}
      <Card>
        <SectionLabel>Ziel-Plattformen</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(PLATFORMS).map(([key, p]) => (
            <span key={key} onClick={() => togglePlatform(key)} style={{
              background: selectedPlatforms.includes(key) ? p.color + "20" : "#0a0a15",
              color: selectedPlatforms.includes(key) ? p.color : "#475569",
              border: `1px solid ${selectedPlatforms.includes(key) ? p.color + "44" : "#ffffff0a"}`,
              padding: "8px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}>
              {p.icon} {p.name}
            </span>
          ))}
        </div>
      </Card>

      {/* Advanced Options */}
      {showAdvanced && (
        <Card>
          <SectionLabel>Kategorie / Nische</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORIES.map(cat => (
              <span key={cat} onClick={() => setCategory(cat)} style={{
                background: category === cat ? "#3B82F618" : "#0a0a15",
                color: category === cat ? "#3B82F6" : "#475569",
                border: `1px solid ${category === cat ? "#3B82F633" : "#ffffff08"}`,
                padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 500,
              }}>{cat}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Generate Button */}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn label={generating ? "KI generiert..." : "Content generieren"} icon="🧠"
          onClick={generate} disabled={!prompt.trim() || generating}
          style={{ flex: 1, justifyContent: "center", padding: "14px 20px", fontSize: 16 }} />
        {generatedText && (
          <Btn label="3 Variationen" icon="🔄" variant="purple" onClick={generateVariations} />
        )}
      </div>

      {/* Generating Animation */}
      {generating && (
        <Card style={{ textAlign: "center", padding: 50 }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🧠</div>
          <div style={{ color: "#3B82F6", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>KI generiert Content...</div>
          <div style={{ color: "#475569", fontSize: 13 }}>
            Analysiere Prompt · Brand Voice · {TONES[tone]?.label} Tonalität · {PLATFORMS[selectedPlatforms[0]]?.name}
          </div>
          <div style={{ maxWidth: 300, margin: "16px auto 0" }}><ProgressBar value={65} color="#3B82F6" /></div>
        </Card>
      )}

      {/* Generated Content */}
      {generatedText && !generating && (
        <Card glow="#3B82F6">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge color="#10B981">KI-generiert</Badge>
              <Badge color={TONES[tone]?.color}>{TONES[tone]?.icon} {TONES[tone]?.label}</Badge>
              <Badge color={CONTENT_TYPES[contentType]?.color}>{CONTENT_TYPES[contentType]?.label}</Badge>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn label="Kopieren" icon="📋" variant="ghost" small onClick={() => navigator.clipboard?.writeText(generatedText)} />
              <Btn label="Speichern & Bearbeiten" icon="✏️" variant="approve" small onClick={saveContent} />
            </div>
          </div>

          <div style={{
            background: "#0a0a15", borderRadius: 10, padding: 20,
            fontSize: 14, color: "#e2e8f0", lineHeight: 1.8,
            border: "1px solid #ffffff06", whiteSpace: "pre-wrap",
            maxHeight: 500, overflowY: "auto",
          }}>
            {done ? generatedText : displayed}
            {!done && <span style={{ animation: "pulse 0.8s infinite", color: "#3B82F6" }}>▊</span>}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid #ffffff08" }}>
            <span style={{ color: "#475569", fontSize: 11 }}>📝 {generatedText.split(/\s+/).length} Wörter</span>
            <span style={{ color: "#475569", fontSize: 11 }}>📏 {generatedText.length} Zeichen</span>
            {selectedPlatforms.map(p => {
              const limit = PLATFORMS[p]?.maxChars || 9999;
              const ok = generatedText.length <= limit;
              return <span key={p} style={{ color: ok ? "#10B981" : "#EF4444", fontSize: 11, fontWeight: 600 }}>
                {PLATFORMS[p]?.icon} {ok ? "✓" : "✗"} {generatedText.length}/{limit}
              </span>;
            })}
          </div>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <SectionLabel>Vorgeschlagene Hashtags</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {hashtags.map(h => (
                  <span key={h} style={{
                    background: "#3B82F610", color: "#3B82F6", padding: "4px 10px",
                    borderRadius: 6, fontSize: 12, fontWeight: 500, border: "1px solid #3B82F622",
                  }}>{h}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Variations */}
      {variations.length > 0 && (
        <Card>
          <SectionLabel>Tonalitäts-Variationen</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {variations.map(v => (
              <div key={v.id} style={{
                background: "#0a0a15", borderRadius: 8, padding: 14,
                borderLeft: `3px solid ${TONES[v.tone]?.color || "#475569"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <Badge color={TONES[v.tone]?.color}>{TONES[v.tone]?.icon} {TONES[v.tone]?.label}</Badge>
                  <Btn label="Verwenden" variant="ghost" small onClick={() => {
                    setTone(v.tone);
                    generate();
                  }} />
                </div>
                <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>{v.text}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════
function TemplatesStage({ onUseTemplate, brandVoice }) {
  const templates = [
    { id: "t1", name: "Listicle Post", type: "social_post", tone: "educational", icon: "📋", desc: "5 Tipps / 7 Fehler / 10 Regeln", prompt: "Die Top [Zahl] [Thema] Tipps für [Zielgruppe]", platforms: ["instagram", "linkedin"], color: "#10B981" },
    { id: "t2", name: "Storytelling Hook", type: "social_post", tone: "storytelling", icon: "📖", desc: "Persönliche Geschichte mit Lektion", prompt: "Eine persönliche Geschichte über [Erfahrung] und was ich daraus gelernt habe", platforms: ["instagram", "linkedin"], color: "#EC4899" },
    { id: "t3", name: "Kontroverse Meinung", type: "social_post", tone: "bold", icon: "🔥", desc: "Unpopular Opinion + Begründung", prompt: "Unpopular Opinion: [kontroverse These zu Thema]", platforms: ["twitter", "linkedin"], color: "#EF4444" },
    { id: "t4", name: "How-To Guide", type: "blog_article", tone: "educational", icon: "🎓", desc: "Schritt-für-Schritt Anleitung", prompt: "Wie du [Ziel] erreichst — Schritt für Schritt erklärt", platforms: ["blog"], color: "#06B6D4" },
    { id: "t5", name: "Video Script (60s)", type: "video_script", tone: "casual", icon: "🎬", desc: "TikTok/Reels Hook-Script", prompt: "Kurzes Video-Script über [Thema] mit starkem Hook", platforms: ["tiktok", "instagram"], color: "#FF0050" },
    { id: "t6", name: "Newsletter Digest", type: "email", tone: "professional", icon: "📧", desc: "Wöchentlicher Newsletter", prompt: "Newsletter über die neuesten Trends in [Branche]", platforms: ["newsletter"], color: "#F59E0B" },
    { id: "t7", name: "Product Launch", type: "ad_copy", tone: "luxury", icon: "🚀", desc: "Produkt-Ankündigung mit FOMO", prompt: "Produktlaunch-Ankündigung für [Produkt] mit exklusivem Early-Access", platforms: ["instagram", "twitter", "linkedin"], color: "#D4AF37" },
    { id: "t8", name: "Twitter/X Thread", type: "thread", tone: "professional", icon: "🧵", desc: "Deep-Dive Thread (7 Posts)", prompt: "Deep-Dive Thread über [Thema] mit Insights und Daten", platforms: ["twitter", "threads"], color: "#1DA1F2" },
    { id: "t9", name: "Behind the Scenes", type: "social_post", tone: "casual", icon: "👀", desc: "Einblick hinter die Kulissen", prompt: "Behind-the-Scenes-Post über [Prozess/Tag/Projekt]", platforms: ["instagram", "tiktok"], color: "#8B5CF6" },
    { id: "t10", name: "Carousel / Swipe", type: "thread", tone: "educational", icon: "📱", desc: "Swipe-Carousel mit Mehrwert", prompt: "Carousel-Post: [Zahl] Dinge die du über [Thema] wissen musst", platforms: ["instagram", "linkedin"], color: "#F97316" },
    { id: "t11", name: "Case Study", type: "blog_article", tone: "professional", icon: "📊", desc: "Kundenreferenz / Erfolgsgeschichte", prompt: "Case Study: Wie [Kunde/Person] mit [Methode] [Ergebnis] erreicht hat", platforms: ["blog", "linkedin"], color: "#3B82F6" },
    { id: "t12", name: "Meme / Trend Post", type: "social_post", tone: "witty", icon: "😂", desc: "Trending Meme-Format nutzen", prompt: "Witziger Post zum Trend [Trend] in der [Branche]-Bubble", platforms: ["twitter", "instagram", "tiktok"], color: "#F59E0B" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, color: "#F59E0B", fontFamily: "'Space Mono', monospace" }}>📋 Content-Templates</h2>
        <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>
          Bewährte Vorlagen für maximales Engagement — wähle, passe an, generiere.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {templates.map(t => (
          <Card key={t.id} glow={t.color} style={{ cursor: "pointer", position: "relative" }}
            onClick={() => onUseTemplate(t)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{t.icon}</div>
              <Badge color={TONES[t.tone]?.color} size="sm">{TONES[t.tone]?.icon} {TONES[t.tone]?.label}</Badge>
            </div>
            <div style={{ color: t.color, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.name}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.4, marginBottom: 8 }}>{t.desc}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {t.platforms.map(p => (
                <span key={p} style={{ fontSize: 11, color: PLATFORMS[p]?.color }}>{PLATFORMS[p]?.icon}</span>
              ))}
            </div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 8, fontStyle: "italic" }}>"{t.prompt}"</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// EDITOR
// ═══════════════════════════════════════
function EditorStage({ contents, setContents }) {
  const drafts = contents.filter(c => c.status === "draft");
  const [activeId, setActiveId] = useState(drafts[0]?.id || null);
  const active = contents.find(c => c.id === activeId);

  const updateContent = (id, updates) => {
    setContents(cs => cs.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  if (contents.length === 0) {
    return (
      <Card style={{ textAlign: "center", padding: 60, color: "#475569" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✏️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8" }}>Noch kein Content erstellt</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>Erstelle Content im AI Studio oder nutze ein Template.</div>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0, fontSize: 22, color: "#10B981", fontFamily: "'Space Mono', monospace" }}>✏️ Content Editor</h2>

      {/* Content List */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {contents.map(c => (
          <div key={c.id} onClick={() => setActiveId(c.id)} style={{
            padding: "8px 14px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap",
            background: activeId === c.id ? "#10B98118" : "#0a0a15",
            border: `1px solid ${activeId === c.id ? "#10B98133" : "#ffffff08"}`,
            color: activeId === c.id ? "#10B981" : "#94a3b8", fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>{CONTENT_TYPES[c.contentType]?.icon || "📝"}</span>
            {(c.title || c.prompt || "Unbenannt").slice(0, 30)}
            <Badge color={c.status === "published" ? "#10B981" : c.status === "scheduled" ? "#06B6D4" : "#475569"} size="sm">
              {c.status === "published" ? "Live" : c.status === "scheduled" ? "📅" : "Draft"}
            </Badge>
          </div>
        ))}
      </div>

      {/* Editor */}
      {active && (
        <>
          <Card>
            <SectionLabel>Titel</SectionLabel>
            <input value={active.title || ""} onChange={e => updateContent(active.id, { title: e.target.value })}
              style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }} placeholder="Content-Titel..." />
          </Card>

          <Card glow="#10B981">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <Badge color={CONTENT_TYPES[active.contentType]?.color}>{CONTENT_TYPES[active.contentType]?.icon} {CONTENT_TYPES[active.contentType]?.label}</Badge>
                <Badge color={TONES[active.tone]?.color}>{TONES[active.tone]?.icon} {TONES[active.tone]?.label}</Badge>
              </div>
              <Btn label="Kopieren" icon="📋" variant="ghost" small onClick={() => navigator.clipboard?.writeText(active.text)} />
            </div>
            <textarea value={active.text || ""} onChange={e => updateContent(active.id, {
              text: e.target.value,
              wordCount: e.target.value.split(/\s+/).length,
              charCount: e.target.value.length,
            })}
              style={{ ...textareaStyle, minHeight: 300, fontSize: 14, lineHeight: 1.8 }} />
            <div style={{ display: "flex", gap: 14, marginTop: 10, paddingTop: 10, borderTop: "1px solid #ffffff08" }}>
              <span style={{ color: "#475569", fontSize: 11 }}>📝 {active.wordCount || 0} Wörter</span>
              <span style={{ color: "#475569", fontSize: 11 }}>📏 {active.charCount || 0} Zeichen</span>
              {(active.platforms || []).map(p => {
                const limit = PLATFORMS[p]?.maxChars || 9999;
                const ok = (active.charCount || 0) <= limit;
                return <span key={p} style={{ color: ok ? "#10B981" : "#EF4444", fontSize: 11, fontWeight: 600 }}>
                  {PLATFORMS[p]?.icon} {ok ? "✓" : "✗"} {active.charCount || 0}/{limit}
                </span>;
              })}
            </div>
          </Card>

          {/* Hashtags */}
          {(active.hashtags || []).length > 0 && (
            <Card>
              <SectionLabel>Hashtags</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {active.hashtags.map(h => (
                  <span key={h} style={{ background: "#3B82F610", color: "#3B82F6", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, border: "1px solid #3B82F622" }}>
                    {h}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <Btn label="Alle kopieren" variant="ghost" small icon="📋"
                  onClick={() => navigator.clipboard?.writeText(active.hashtags.join(" "))} />
              </div>
            </Card>
          )}

          {/* Platforms */}
          <Card>
            <SectionLabel>Plattformen</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(PLATFORMS).map(([key, p]) => (
                <span key={key} onClick={() => updateContent(active.id, {
                  platforms: (active.platforms || []).includes(key)
                    ? (active.platforms || []).filter(x => x !== key)
                    : [...(active.platforms || []), key]
                })} style={{
                  background: (active.platforms || []).includes(key) ? p.color + "20" : "#0a0a15",
                  color: (active.platforms || []).includes(key) ? p.color : "#475569",
                  border: `1px solid ${(active.platforms || []).includes(key) ? p.color + "44" : "#ffffff0a"}`,
                  padding: "8px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600,
                }}>{p.icon} {p.name}</span>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Als Entwurf speichern" icon="💾" variant="ghost"
              onClick={() => updateContent(active.id, { status: "draft" })} />
            <Btn label="Planen" icon="📅" variant="cyan"
              onClick={() => updateContent(active.id, { status: "scheduled" })} />
            <Btn label="Jetzt veröffentlichen" icon="🚀" variant="approve"
              onClick={() => updateContent(active.id, {
                status: "published",
                reach: Math.floor(500 + Math.random() * 10000),
                engagement: Math.floor(50 + Math.random() * 2000),
                publishedAt: new Date().toISOString(),
              })} />
            <div style={{ flex: 1 }} />
            <Btn label="Löschen" icon="🗑" variant="reject" small
              onClick={() => { setContents(cs => cs.filter(c => c.id !== active.id)); setActiveId(null); }} />
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MEDIA
// ═══════════════════════════════════════
function MediaStage() {
  const [mediaItems] = useState([
    { id: "m1", name: "hero-banner.jpg", type: "image", size: "2.4 MB", dims: "1920×1080", tags: ["Banner", "Hero"], color: "#E4405F" },
    { id: "m2", name: "product-shot-01.png", type: "image", size: "1.8 MB", dims: "1080×1080", tags: ["Product", "Instagram"], color: "#8B5CF6" },
    { id: "m3", name: "team-photo.jpg", type: "image", size: "3.1 MB", dims: "2400×1600", tags: ["Team", "About"], color: "#10B981" },
    { id: "m4", name: "logo-dark.svg", type: "vector", size: "24 KB", dims: "SVG", tags: ["Logo", "Branding"], color: "#F59E0B" },
    { id: "m5", name: "promo-video.mp4", type: "video", size: "48 MB", dims: "1080×1920", tags: ["Reel", "Promo"], color: "#FF0050" },
    { id: "m6", name: "thumbnail-template.psd", type: "design", size: "12 MB", dims: "1280×720", tags: ["YouTube", "Thumbnail"], color: "#FF0000" },
    { id: "m7", name: "carousel-01.png", type: "image", size: "890 KB", dims: "1080×1350", tags: ["Carousel", "Instagram"], color: "#E4405F" },
    { id: "m8", name: "story-template.png", type: "image", size: "1.2 MB", dims: "1080×1920", tags: ["Story", "Template"], color: "#06B6D4" },
  ]);

  const typeIcons = { image: "🖼", video: "🎬", vector: "🎨", design: "✏️" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#EC4899", fontFamily: "'Space Mono', monospace" }}>🖼 Media Library</h2>
          <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>{mediaItems.length} Dateien · Bilder, Videos, Templates</p>
        </div>
        <Btn label="Hochladen" icon="📤" variant="pink" />
      </div>

      {/* Format Sizes */}
      <Card>
        <SectionLabel>Optimale Bildgrößen pro Plattform</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { plat: "instagram", sizes: ["Feed: 1080×1080", "Story: 1080×1920", "Reel: 1080×1920"] },
            { plat: "twitter", sizes: ["Post: 1200×675", "Header: 1500×500", "Profile: 400×400"] },
            { plat: "linkedin", sizes: ["Post: 1200×627", "Banner: 1584×396", "Article: 1200×644"] },
            { plat: "youtube", sizes: ["Thumbnail: 1280×720", "Banner: 2560×1440", "Short: 1080×1920"] },
          ].map(item => (
            <div key={item.plat} style={{ background: "#0a0a15", borderRadius: 8, padding: 12, border: `1px solid ${PLATFORMS[item.plat]?.color}22` }}>
              <div style={{ color: PLATFORMS[item.plat]?.color, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
                {PLATFORMS[item.plat]?.icon} {PLATFORMS[item.plat]?.name}
              </div>
              {item.sizes.map(s => (
                <div key={s} style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{s}</div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Media Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {mediaItems.map(item => (
          <Card key={item.id} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              height: 120, background: `linear-gradient(135deg, ${item.color}22, ${item.color}08)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            }}>
              {typeIcons[item.type] || "📄"}
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569", fontSize: 10 }}>
                <span>{item.size}</span>
                <span>{item.dims}</span>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                {item.tags.map(t => <Badge key={t} color={item.color} size="sm">{t}</Badge>)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════
function CalendarStage({ contents, setContents }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1; // Monday start
  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  const scheduled = contents.filter(c => c.status === "scheduled" || c.status === "published");

  // Distribute content across calendar for demo
  const contentByDay = {};
  scheduled.forEach((c, i) => {
    const day = (i * 3 + 1) % daysInMonth + 1;
    contentByDay[day] = contentByDay[day] || [];
    contentByDay[day].push(c);
  });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#06B6D4", fontFamily: "'Space Mono', monospace" }}>📅 Content-Kalender</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn label="◀" variant="ghost" small onClick={prevMonth} />
          <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: "center" }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <Btn label="▶" variant="ghost" small onClick={nextMonth} />
        </div>
      </div>

      {/* Weekday Headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
          <div key={d} style={{ textAlign: "center", color: "#475569", fontSize: 11, fontWeight: 700, padding: 8 }}>{d}</div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: adjustedFirst }).map((_, i) => (
          <div key={`empty-${i}`} style={{ background: "#0a0a0f", borderRadius: 8, minHeight: 80 }} />
        ))}

        {/* Calendar Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
          const dayContents = contentByDay[day] || [];
          return (
            <div key={day} style={{
              background: isToday ? "#06B6D408" : "#0a0a15",
              border: `1px solid ${isToday ? "#06B6D433" : "#ffffff06"}`,
              borderRadius: 8, minHeight: 80, padding: 6, position: "relative",
            }}>
              <div style={{
                color: isToday ? "#06B6D4" : "#94a3b8", fontSize: 12, fontWeight: isToday ? 800 : 500,
                marginBottom: 4,
              }}>{day}</div>
              {dayContents.map(c => (
                <div key={c.id} style={{
                  background: (CONTENT_TYPES[c.contentType]?.color || "#475569") + "18",
                  borderLeft: `2px solid ${CONTENT_TYPES[c.contentType]?.color || "#475569"}`,
                  borderRadius: 4, padding: "2px 6px", fontSize: 9, color: "#e2e8f0",
                  marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {CONTENT_TYPES[c.contentType]?.icon} {(c.title || c.prompt || "").slice(0, 15)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Upcoming */}
      {scheduled.length > 0 && (
        <Card>
          <SectionLabel>Geplante Inhalte</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scheduled.map(c => (
              <div key={c.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "#0a0a15", borderRadius: 8,
                borderLeft: `3px solid ${CONTENT_TYPES[c.contentType]?.color || "#475569"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{CONTENT_TYPES[c.contentType]?.icon}</span>
                  <div>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{c.title || c.prompt}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                      {(c.platforms || []).map(p => <PlatformBadge key={p} platformKey={p} />)}
                    </div>
                  </div>
                </div>
                <Badge color={c.status === "published" ? "#10B981" : "#06B6D4"}>
                  {c.status === "published" ? "✓ Live" : "📅 Geplant"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// PUBLISH
// ═══════════════════════════════════════
function PublishStage({ contents, setContents }) {
  const ready = contents.filter(c => c.status === "draft" || c.status === "scheduled");
  const published = contents.filter(c => c.status === "published");

  const publishItem = (id) => {
    setContents(cs => cs.map(c => c.id === id ? {
      ...c, status: "published",
      publishedAt: new Date().toISOString(),
      reach: Math.floor(800 + Math.random() * 15000),
      engagement: Math.floor(100 + Math.random() * 3000),
    } : c));
  };

  const publishAll = () => {
    setContents(cs => cs.map(c => (c.status === "draft" || c.status === "scheduled") ? {
      ...c, status: "published",
      publishedAt: new Date().toISOString(),
      reach: Math.floor(800 + Math.random() * 15000),
      engagement: Math.floor(100 + Math.random() * 3000),
    } : c));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#F97316", fontFamily: "'Space Mono', monospace" }}>🚀 Multi-Platform Publish</h2>
          <p style={{ color: "#475569", fontSize: 13, margin: "6px 0 0" }}>
            {ready.length} bereit zum Veröffentlichen · {published.length} live
          </p>
        </div>
        {ready.length > 0 && (
          <Btn label={`Alle veröffentlichen (${ready.length})`} icon="🚀" variant="sell" onClick={publishAll} />
        )}
      </div>

      {ready.length === 0 && published.length === 0 && (
        <Card style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8" }}>Kein Content zum Veröffentlichen</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Erstelle Content im AI Studio und komme hierher zurück.</div>
        </Card>
      )}

      {ready.map(c => (
        <Card key={c.id} style={{ borderLeft: `3px solid ${CONTENT_TYPES[c.contentType]?.color || "#F97316"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Badge color={CONTENT_TYPES[c.contentType]?.color}>{CONTENT_TYPES[c.contentType]?.icon} {CONTENT_TYPES[c.contentType]?.label}</Badge>
                <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>{c.title || c.prompt}</span>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                {(c.text || "").slice(0, 150)}...
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "#475569", fontSize: 11 }}>📝 {c.wordCount || 0} Wörter</span>
                <span style={{ color: "#475569", fontSize: 11 }}>·</span>
                {(c.platforms || []).map(p => <PlatformBadge key={p} platformKey={p} />)}
              </div>
            </div>
            <Btn label="Veröffentlichen" icon="🚀" variant="sell" onClick={() => publishItem(c.id)} small />
          </div>
        </Card>
      ))}

      {published.length > 0 && (
        <>
          <div style={{ color: "#10B981", fontSize: 13, fontWeight: 700, marginTop: 8 }}>✓ Veröffentlicht ({published.length})</div>
          {published.map(c => (
            <div key={c.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", background: "#10B98108", borderLeft: "3px solid #10B981",
              borderRadius: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{CONTENT_TYPES[c.contentType]?.icon}</span>
                <span style={{ color: "#e2e8f0", fontSize: 13 }}>{c.title || c.prompt}</span>
                {(c.platforms || []).map(p => <span key={p} style={{ fontSize: 11 }}>{PLATFORMS[p]?.icon}</span>)}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ color: "#8B5CF6", fontSize: 12 }}>👁 {c.reach?.toLocaleString()}</span>
                <span style={{ color: "#10B981", fontSize: 12 }}>❤️ {c.engagement?.toLocaleString()}</span>
                <Badge color="#10B981">Live</Badge>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════
function AnalyticsStage({ contents }) {
  const published = contents.filter(c => c.status === "published");
  const totalReach = published.reduce((s, c) => s + (c.reach || 0), 0);
  const totalEngagement = published.reduce((s, c) => s + (c.engagement || 0), 0);
  const avgEngRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : "0.0";
  const totalWords = contents.reduce((s, c) => s + (c.wordCount || 0), 0);

  const platformStats = {};
  published.forEach(c => {
    (c.platforms || []).forEach(p => {
      if (!platformStats[p]) platformStats[p] = { posts: 0, reach: 0, engagement: 0 };
      platformStats[p].posts++;
      platformStats[p].reach += c.reach || 0;
      platformStats[p].engagement += c.engagement || 0;
    });
  });

  const typeStats = {};
  contents.forEach(c => {
    if (!typeStats[c.contentType]) typeStats[c.contentType] = { total: 0, published: 0, reach: 0 };
    typeStats[c.contentType].total++;
    if (c.status === "published") { typeStats[c.contentType].published++; typeStats[c.contentType].reach += c.reach || 0; }
  });

  const toneStats = {};
  contents.forEach(c => {
    if (!toneStats[c.tone]) toneStats[c.tone] = { count: 0, reach: 0, engagement: 0 };
    toneStats[c.tone].count++;
    if (c.status === "published") { toneStats[c.tone].reach += c.reach || 0; toneStats[c.tone].engagement += c.engagement || 0; }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0, fontSize: 22, color: "#6366F1", fontFamily: "'Space Mono', monospace" }}>📊 Content Analytics</h2>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {[
          { icon: "📝", l: "Content erstellt", v: contents.length, c: "#3B82F6" },
          { icon: "🚀", l: "Veröffentlicht", v: published.length, c: "#10B981" },
          { icon: "👁", l: "Reichweite", v: totalReach > 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach, c: "#8B5CF6" },
          { icon: "❤️", l: "Engagement", v: totalEngagement > 1000 ? `${(totalEngagement / 1000).toFixed(1)}K` : totalEngagement, c: "#EC4899" },
          { icon: "📈", l: "Eng. Rate", v: `${avgEngRate}%`, c: "#F59E0B" },
        ].map(k => (
          <Card key={k.l} style={{ textAlign: "center", padding: 14 }}>
            <div style={{ fontSize: 18 }}>{k.icon}</div>
            <div style={{ color: k.c, fontSize: 22, fontWeight: 800, marginTop: 2 }}>{k.v}</div>
            <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>{k.l}</div>
          </Card>
        ))}
      </div>

      {/* Content Funnel */}
      <Card>
        <SectionLabel>Content Funnel</SectionLabel>
        {[
          { l: "Erstellt", c: contents.length, color: "#3B82F6" },
          { l: "Geplant", c: contents.filter(c2 => c2.status === "scheduled").length, color: "#06B6D4" },
          { l: "Veröffentlicht", c: published.length, color: "#10B981" },
        ].map(s => (
          <div key={s.l} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>{s.l}</span>
              <span style={{ color: s.color, fontWeight: 700, fontSize: 12 }}>{s.c}</span>
            </div>
            <ProgressBar value={s.c} max={Math.max(contents.length, 1)} color={s.color} height={10} />
          </div>
        ))}
      </Card>

      {/* Per Platform */}
      {Object.keys(platformStats).length > 0 && (
        <Card>
          <SectionLabel>Performance pro Plattform</SectionLabel>
          {Object.entries(platformStats).sort((a, b) => b[1].reach - a[1].reach).map(([key, stats]) => (
            <div key={key} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: "1px solid #ffffff06",
            }}>
              <PlatformBadge platformKey={key} size="md" />
              <div style={{ display: "flex", gap: 18, fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>Posts: <strong style={{ color: "#e2e8f0" }}>{stats.posts}</strong></span>
                <span style={{ color: "#64748b" }}>Reichweite: <strong style={{ color: "#8B5CF6" }}>{stats.reach.toLocaleString()}</strong></span>
                <span style={{ color: "#64748b" }}>Engagement: <strong style={{ color: "#10B981" }}>{stats.engagement.toLocaleString()}</strong></span>
                <span style={{ color: "#F59E0B", fontWeight: 700 }}>
                  {stats.reach > 0 ? ((stats.engagement / stats.reach) * 100).toFixed(1) : 0}% Rate
                </span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Per Content Type */}
      {Object.keys(typeStats).length > 0 && (
        <Card>
          <SectionLabel>Performance pro Content-Typ</SectionLabel>
          {Object.entries(typeStats).sort((a, b) => b[1].reach - a[1].reach).map(([key, stats]) => (
            <div key={key} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: "1px solid #ffffff06",
            }}>
              <Badge color={CONTENT_TYPES[key]?.color}>{CONTENT_TYPES[key]?.icon} {CONTENT_TYPES[key]?.label}</Badge>
              <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>Erstellt: <strong style={{ color: "#e2e8f0" }}>{stats.total}</strong></span>
                <span style={{ color: "#64748b" }}>Published: <strong style={{ color: "#10B981" }}>{stats.published}</strong></span>
                <span style={{ color: "#8B5CF6", fontWeight: 700 }}>👁 {stats.reach.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Tone Analysis */}
      {Object.keys(toneStats).length > 0 && (
        <Card>
          <SectionLabel>Tonalitäts-Analyse</SectionLabel>
          {Object.entries(toneStats).sort((a, b) => b[1].reach - a[1].reach).map(([key, stats]) => (
            <div key={key} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: "1px solid #ffffff06",
            }}>
              <Badge color={TONES[key]?.color}>{TONES[key]?.icon} {TONES[key]?.label}</Badge>
              <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>Verwendet: <strong style={{ color: "#e2e8f0" }}>{stats.count}x</strong></span>
                <span style={{ color: "#8B5CF6", fontWeight: 700 }}>👁 {stats.reach.toLocaleString()}</span>
                <span style={{ color: "#10B981", fontWeight: 700 }}>❤️ {stats.engagement.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Insights */}
      <Card glow="#6366F1" style={{ borderLeft: "3px solid #6366F1" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <div>
            <div style={{ color: "#6366F1", fontWeight: 700, fontSize: 13 }}>AI-Insights</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
              {published.length > 0 ? (
                <>
                  Du hast insgesamt <strong style={{ color: "#e2e8f0" }}>{totalWords.toLocaleString()} Wörter</strong> generiert.
                  Deine durchschnittliche Engagement-Rate liegt bei <strong style={{ color: parseFloat(avgEngRate) > 5 ? "#10B981" : "#F59E0B" }}>{avgEngRate}%</strong>.
                  {parseFloat(avgEngRate) > 5
                    ? " Das ist überdurchschnittlich — weiter so! 🔥"
                    : " Tipp: Teste verschiedene Tonalitäten und nutze stärkere Hooks für mehr Engagement."
                  }
                </>
              ) : (
                "Veröffentliche Content, um AI-gestützte Insights zu deiner Performance zu erhalten."
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function FlipFlowPro() {
  const [stage, setStage] = useState(STAGES.DASHBOARD);
  const [brandVoice, setBrandVoice] = useState({
    name: "", niche: "", defaultTone: "professional",
    audience: "", keywords: [], dos: "", donts: "", examples: "",
  });
  const [contents, setContents] = useState([]);

  const navOrder = [
    STAGES.DASHBOARD, STAGES.BRAND, STAGES.STUDIO, STAGES.TEMPLATES,
    STAGES.EDITOR, STAGES.MEDIA, STAGES.CALENDAR, STAGES.PUBLISH, STAGES.ANALYTICS,
  ];

  const handleContentCreated = (content) => {
    setContents(cs => [content, ...cs]);
  };

  const handleUseTemplate = (template) => {
    // Pre-fill studio would be better, but for now just navigate
    setStage(STAGES.STUDIO);
  };

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
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #8B5CF6, #3B82F6, #06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🧠</div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 16, letterSpacing: "-0.03em" }}>
              FlipFlow <span style={{ background: "linear-gradient(90deg, #8B5CF6, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Creator</span>
            </div>
            <div style={{ fontSize: 10, color: "#475569" }}>AI-Powered Content Creation Engine</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {Object.entries(PLATFORMS).slice(0, 6).map(([k, p]) => (
              <span key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, opacity: 0.6 }} />
            ))}
          </div>
          <Badge color="#8B5CF6" size="sm">🧠 AI Ready</Badge>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B98166", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: "#10B981", fontWeight: 700 }}>LIVE</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 2, padding: "10px 16px", overflowX: "auto", borderBottom: "1px solid #ffffff05" }}>
        {navOrder.map(s => {
          const m = STAGE_META[s];
          const isActive = stage === s;
          return (
            <div key={s} onClick={() => setStage(s)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7,
              background: isActive ? m.color + "15" : "transparent",
              border: `1px solid ${isActive ? m.color + "33" : "transparent"}`,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              transition: "all 0.15s ease",
            }}>
              <span style={{ fontSize: 13 }}>{m.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? m.color : "#475569" }}>{m.label}</span>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 16px 60px" }}>
        {stage === STAGES.DASHBOARD && <DashboardStage contents={contents} brandVoice={brandVoice} onNavigate={setStage} />}
        {stage === STAGES.BRAND && <BrandStage brandVoice={brandVoice} setBrandVoice={setBrandVoice} />}
        {stage === STAGES.STUDIO && <StudioStage brandVoice={brandVoice} onContentCreated={handleContentCreated} onNavigateEditor={() => setStage(STAGES.EDITOR)} />}
        {stage === STAGES.TEMPLATES && <TemplatesStage onUseTemplate={handleUseTemplate} brandVoice={brandVoice} />}
        {stage === STAGES.EDITOR && <EditorStage contents={contents} setContents={setContents} />}
        {stage === STAGES.MEDIA && <MediaStage />}
        {stage === STAGES.CALENDAR && <CalendarStage contents={contents} setContents={setContents} />}
        {stage === STAGES.PUBLISH && <PublishStage contents={contents} setContents={setContents} />}
        {stage === STAGES.ANALYTICS && <AnalyticsStage contents={contents} />}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ffffff12;border-radius:99px}`}</style>
    </div>
  );
}
