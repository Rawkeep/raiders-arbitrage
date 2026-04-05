// ─── IndexedDB Storage Layer ───
// Primary: IndexedDB (async, large capacity)
// Fallback: localStorage (sync, for initial render + old browsers)

const DB_NAME = "flipflow_pro";
const DB_VERSION = 1;
const STORE_NAME = "state";
const LS_PREFIX = "flipflow_";

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

// ── IndexedDB ops ──

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const keys = store.getAllKeys();
    const vals = store.getAll();
    tx.oncomplete = () => {
      const result = {};
      keys.result.forEach((k, i) => { result[k] = vals.result[i]; });
      resolve(result);
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function idbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Sync load (localStorage, for initial render before IDB is ready) ──

function lsLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSave(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch { /* quota */ }
}

// ── Public API ──

/** Synchronous load for useState initializer (localStorage) */
export function loadSync(key, fallback) {
  return lsLoad(key, fallback);
}

/** Async save to both IndexedDB + localStorage */
export async function save(key, value) {
  lsSave(key, value);
  try {
    await idbSet(key, value);
  } catch { /* IDB unavailable, localStorage is still there */ }
}

/** Async load from IndexedDB with localStorage fallback */
export async function load(key, fallback) {
  try {
    const val = await idbGet(key);
    if (val !== undefined) return val;
  } catch { /* fall through */ }
  return lsLoad(key, fallback);
}

/** Export all data from IndexedDB (fallback: localStorage) */
export async function exportAllData() {
  let data;
  try {
    data = await idbGetAll();
  } catch {
    data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(LS_PREFIX)) {
        try { data[k.slice(LS_PREFIX.length)] = JSON.parse(localStorage.getItem(k)); }
        catch { data[k.slice(LS_PREFIX.length)] = localStorage.getItem(k); }
      }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flipflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import JSON backup into both IndexedDB + localStorage */
export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        for (const [key, value] of Object.entries(data)) {
          lsSave(key, value);
          try { await idbSet(key, value); } catch {}
        }
        resolve(data);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/** Clear all app data from both stores */
export async function clearAllData() {
  // localStorage
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(LS_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
  // IndexedDB
  try { await idbClear(); } catch {}
}

/** Hydrate: after mount, sync IDB → state (if IDB has newer/different data) */
export async function hydrateFromIDB(key, currentValue, setter) {
  try {
    const stored = await idbGet(key);
    if (stored !== undefined && JSON.stringify(stored) !== JSON.stringify(currentValue)) {
      setter(stored);
    }
  } catch { /* IDB not available, keep localStorage value */ }
}
