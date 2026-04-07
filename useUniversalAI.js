import { useState, useCallback, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

export const CLOUD_PROVIDERS = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com',
    chatPath: '/v1/messages',
    browserDirect: false,
    authStyle: 'x-api-key',
    pricing: 'Sonnet ~$3/$15 per 1M tok, Haiku ~$0.80/$4, Opus ~$15/$75',
    defaultModels: [
      'claude-sonnet-4-20250514',
      'claude-haiku-4-20250414',
      'claude-opus-4-20250514',
    ],
    buildHeaders(apiKey) {
      return {
        'x-api-key': apiKey,
        'anthropic-version': '2024-01-01',
        'content-type': 'application/json',
      };
    },
    buildBody(messages, model, systemPrompt, stream) {
      const body = { model, messages, stream };
      if (systemPrompt) body.system = systemPrompt;
      if (stream) body.stream = true;
      return body;
    },
    parseResponse(json) {
      if (json.content && json.content.length > 0) {
        return json.content.map((b) => b.text).join('');
      }
      return '';
    },
    parseStreamEvent(eventType, data) {
      if (eventType === 'content_block_delta' && data.delta?.text) {
        return data.delta.text;
      }
      return null;
    },
    isStreamDone(eventType) {
      return eventType === 'message_stop';
    },
  },

  openai: {
    id: 'openai',
    name: 'OpenAI (GPT)',
    baseUrl: 'https://api.openai.com',
    chatPath: '/v1/chat/completions',
    browserDirect: true,
    authStyle: 'bearer',
    pricing: 'GPT-4o ~$2.50/$10 per 1M tok, GPT-4o-mini ~$0.15/$0.60',
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'o4-mini', 'o3'],
    buildHeaders(apiKey) {
      return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
    },
    buildBody(messages, model, systemPrompt, stream) {
      const msgs = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;
      return { model, messages: msgs, stream: !!stream };
    },
    parseResponse(json) {
      return json.choices?.[0]?.message?.content ?? '';
    },
    parseStreamEvent(_eventType, data) {
      return data.choices?.[0]?.delta?.content ?? null;
    },
    isStreamDone(_eventType, data) {
      return data.choices?.[0]?.finish_reason != null;
    },
  },

  gemini: {
    id: 'gemini',
    name: 'Google (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com',
    chatPath: '/v1beta/chat/completions',
    browserDirect: true,
    authStyle: 'bearer',
    pricing: 'Flash ~$0.15/$0.60 per 1M tok, Pro ~$1.25/$10',
    defaultModels: ['gemini-2.5-flash', 'gemini-2.5-pro'],
    buildHeaders(apiKey) {
      return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
    },
    buildBody(messages, model, systemPrompt, stream) {
      const msgs = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;
      return { model, messages: msgs, stream: !!stream };
    },
    parseResponse(json) {
      return json.choices?.[0]?.message?.content ?? '';
    },
    parseStreamEvent(_eventType, data) {
      return data.choices?.[0]?.delta?.content ?? null;
    },
    isStreamDone(_eventType, data) {
      return data.choices?.[0]?.finish_reason != null;
    },
  },

  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai',
    chatPath: '/v1/chat/completions',
    browserDirect: true,
    authStyle: 'bearer',
    pricing: 'Large ~$2/$6 per 1M tok, Small ~$0.10/$0.30, Codestral ~$0.30/$0.90',
    defaultModels: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
    buildHeaders(apiKey) {
      return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
    },
    buildBody(messages, model, systemPrompt, stream) {
      const msgs = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;
      return { model, messages: msgs, stream: !!stream };
    },
    parseResponse(json) {
      return json.choices?.[0]?.message?.content ?? '';
    },
    parseStreamEvent(_eventType, data) {
      return data.choices?.[0]?.delta?.content ?? null;
    },
    isStreamDone(_eventType, data) {
      return data.choices?.[0]?.finish_reason != null;
    },
  },

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api',
    chatPath: '/v1/chat/completions',
    browserDirect: true,
    authStyle: 'bearer',
    pricing: 'Variiert je nach Modell - siehe openrouter.ai/models',
    defaultModels: [
      'anthropic/claude-sonnet-4',
      'openai/gpt-4o',
      'google/gemini-2.5-flash',
      'deepseek/deepseek-r1',
    ],
    buildHeaders(apiKey) {
      return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'Flipflow',
      };
    },
    buildBody(messages, model, systemPrompt, stream) {
      const msgs = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;
      return { model, messages: msgs, stream: !!stream };
    },
    parseResponse(json) {
      return json.choices?.[0]?.message?.content ?? '';
    },
    parseStreamEvent(_eventType, data) {
      return data.choices?.[0]?.delta?.content ?? null;
    },
    isStreamDone(_eventType, data) {
      return data.choices?.[0]?.finish_reason != null;
    },
  },

  groq: {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai',
    chatPath: '/v1/chat/completions',
    browserDirect: true,
    authStyle: 'bearer',
    pricing: 'Llama 3.3 70B ~$0.59/$0.79 per 1M tok, 8B kostenlos (Limit)',
    defaultModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    buildHeaders(apiKey) {
      return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
    },
    buildBody(messages, model, systemPrompt, stream) {
      const msgs = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;
      return { model, messages: msgs, stream: !!stream };
    },
    parseResponse(json) {
      return json.choices?.[0]?.message?.content ?? '';
    },
    parseStreamEvent(_eventType, data) {
      return data.choices?.[0]?.delta?.content ?? null;
    },
    isStreamDone(_eventType, data) {
      return data.choices?.[0]?.finish_reason != null;
    },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KEYS_STORAGE_KEY = 'universal_ai_keys';
const CONFIG_STORAGE_KEY = 'universal_ai_config';
const FREEMIUM_STORAGE_KEY = 'universal_ai_freemium';
const MAX_FREE_PER_DAY = 5;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Speicher voll - stille Behandlung
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getFreemiumCount() {
  const data = loadJSON(FREEMIUM_STORAGE_KEY, {});
  const today = todayKey();
  return data[today] ?? 0;
}

function incrementFreemium() {
  const data = loadJSON(FREEMIUM_STORAGE_KEY, {});
  const today = todayKey();
  // Alte Eintraege bereinigen
  const cleaned = {};
  cleaned[today] = (data[today] ?? 0) + 1;
  saveJSON(FREEMIUM_STORAGE_KEY, cleaned);
  return cleaned[today];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// SSE line parser
// ---------------------------------------------------------------------------

function parseSSELines(buffer) {
  const events = [];
  const lines = buffer.split('\n');
  let currentEvent = '';
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('event:')) {
      currentEvent = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      currentData = line.slice(5).trim();
    } else if (line === '') {
      if (currentData) {
        events.push({ event: currentEvent || 'message', data: currentData });
      }
      currentEvent = '';
      currentData = '';
    }
  }

  // Unvollstaendige letzte Zeile zurueckgeben
  const lastNewline = buffer.lastIndexOf('\n');
  const remainder = lastNewline >= 0 ? buffer.slice(lastNewline + 1) : buffer;

  return { events, remainder };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUniversalAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamText, setStreamText] = useState('');
  const [activeProvider, setActiveProviderState] = useState(() => {
    const cfg = loadJSON(CONFIG_STORAGE_KEY, {});
    return cfg.provider ?? 'openai';
  });
  const [activeModel, setActiveModelState] = useState(() => {
    const cfg = loadJSON(CONFIG_STORAGE_KEY, {});
    if (cfg.model) return cfg.model;
    const prov = cfg.provider ?? 'openai';
    return CLOUD_PROVIDERS[prov]?.defaultModels[0] ?? '';
  });
  const [keys, setKeysState] = useState(() => loadJSON(KEYS_STORAGE_KEY, {}));
  const [proxyUrl, setProxyUrlState] = useState(() => {
    const cfg = loadJSON(CONFIG_STORAGE_KEY, {});
    return cfg.proxyUrl ?? '';
  });

  const abortRef = useRef(null);

  // ---- Persistence helpers ----

  const setActiveProvider = useCallback((providerId) => {
    if (!CLOUD_PROVIDERS[providerId]) return;
    setActiveProviderState(providerId);
    const cfg = loadJSON(CONFIG_STORAGE_KEY, {});
    cfg.provider = providerId;
    // Modell auf Default zuruecksetzen wenn Provider wechselt
    const defaultModel = CLOUD_PROVIDERS[providerId].defaultModels[0];
    cfg.model = defaultModel;
    setActiveModelState(defaultModel);
    saveJSON(CONFIG_STORAGE_KEY, cfg);
  }, []);

  const setActiveModel = useCallback((model) => {
    setActiveModelState(model);
    const cfg = loadJSON(CONFIG_STORAGE_KEY, {});
    cfg.model = model;
    saveJSON(CONFIG_STORAGE_KEY, cfg);
  }, []);

  const setApiKey = useCallback((providerId, key) => {
    setKeysState((prev) => {
      const next = { ...prev, [providerId]: key };
      saveJSON(KEYS_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const setProxyUrl = useCallback((url) => {
    setProxyUrlState(url);
    const cfg = loadJSON(CONFIG_STORAGE_KEY, {});
    cfg.proxyUrl = url;
    saveJSON(CONFIG_STORAGE_KEY, cfg);
  }, []);

  const clearKeys = useCallback(() => {
    setKeysState({});
    saveJSON(KEYS_STORAGE_KEY, {});
  }, []);

  // ---- Resolve endpoint ----

  const resolveEndpoint = useCallback(
    (provider) => {
      const prov = CLOUD_PROVIDERS[provider];
      if (!prov) throw new Error(`Unbekannter Anbieter: ${provider}`);

      const apiKey = keys[provider];

      // Wenn kein API-Key und kein Proxy -> Freemium pruefen
      if (!apiKey && !proxyUrl) {
        const count = getFreemiumCount();
        if (count >= MAX_FREE_PER_DAY) {
          throw new Error(
            `Tageslimit erreicht (${MAX_FREE_PER_DAY}/${MAX_FREE_PER_DAY}). ` +
              'Bitte API-Schluessel eingeben oder morgen erneut versuchen.'
          );
        }
      }

      // Proxy verwenden wenn kein Browser-Direktzugriff oder kein Key
      if (proxyUrl && (!prov.browserDirect || !apiKey)) {
        return {
          url: proxyUrl,
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-User-Api-Key': apiKey } : {}),
            'X-Provider': provider,
          },
          useProxy: true,
        };
      }

      if (!apiKey) {
        throw new Error(
          `Kein API-Schluessel fuer ${prov.name}. ` +
            'Bitte Schluessel eingeben oder Proxy-URL konfigurieren.'
        );
      }

      return {
        url: `${prov.baseUrl}${prov.chatPath}`,
        headers: prov.buildHeaders(apiKey),
        useProxy: false,
      };
    },
    [keys, proxyUrl]
  );

  // ---- Core fetch with retry ----

  const fetchWithRetry = useCallback(
    async (url, options, retries = MAX_RETRIES) => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, options);
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS * (attempt + 1);
            if (attempt < retries) {
              await sleep(waitMs);
              continue;
            }
            throw new Error('Rate-Limit erreicht. Bitte spaeter erneut versuchen.');
          }
          if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            let errMsg;
            try {
              const parsed = JSON.parse(errBody);
              errMsg = parsed.error?.message || parsed.message || errBody;
            } catch {
              errMsg = errBody;
            }
            throw new Error(`API-Fehler ${response.status}: ${errMsg}`);
          }
          return response;
        } catch (err) {
          if (err.name === 'AbortError') throw err;
          lastError = err;
          if (attempt < retries) {
            await sleep(RETRY_DELAY_MS * (attempt + 1));
          }
        }
      }
      throw lastError;
    },
    []
  );

  // ---- ask (non-streaming) ----

  const ask = useCallback(
    async (messages, options = {}) => {
      const provider = options.provider ?? activeProvider;
      const model = options.model ?? activeModel;
      const systemPrompt = options.systemPrompt ?? null;

      setLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const prov = CLOUD_PROVIDERS[provider];
        if (!prov) throw new Error(`Unbekannter Anbieter: ${provider}`);

        const endpoint = resolveEndpoint(provider);
        const body = prov.buildBody(messages, model, systemPrompt, false);

        const response = await fetchWithRetry(endpoint.url, {
          method: 'POST',
          headers: endpoint.headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const json = await response.json();
        const text = prov.parseResponse(json);

        // Freemium zaehlen wenn kein Key
        if (!keys[provider]) {
          incrementFreemium();
        }

        setLoading(false);
        return { text, raw: json, provider, model };
      } catch (err) {
        if (err.name === 'AbortError') {
          setLoading(false);
          return { text: '', aborted: true, provider, model };
        }
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [activeProvider, activeModel, keys, resolveEndpoint, fetchWithRetry]
  );

  // ---- askStream (streaming SSE) ----

  const askStream = useCallback(
    async (messages, options = {}) => {
      const provider = options.provider ?? activeProvider;
      const model = options.model ?? activeModel;
      const systemPrompt = options.systemPrompt ?? null;
      const onToken = options.onToken ?? null;
      const onDone = options.onDone ?? null;
      const onError = options.onError ?? null;

      setLoading(true);
      setError(null);
      setStreamText('');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const prov = CLOUD_PROVIDERS[provider];
        if (!prov) throw new Error(`Unbekannter Anbieter: ${provider}`);

        const endpoint = resolveEndpoint(provider);
        const body = prov.buildBody(messages, model, systemPrompt, true);

        const response = await fetchWithRetry(endpoint.url, {
          method: 'POST',
          headers: endpoint.headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const { events, remainder } = parseSSELines(sseBuffer);
          sseBuffer = remainder;

          for (const evt of events) {
            if (evt.data === '[DONE]') {
              break;
            }

            let parsed;
            try {
              parsed = JSON.parse(evt.data);
            } catch {
              continue;
            }

            if (prov.isStreamDone(evt.event, parsed)) {
              break;
            }

            const token = prov.parseStreamEvent(evt.event, parsed);
            if (token) {
              accumulated += token;
              setStreamText(accumulated);
              if (onToken) onToken(token, accumulated);
            }
          }
        }

        // Freemium zaehlen wenn kein Key
        if (!keys[provider]) {
          incrementFreemium();
        }

        setLoading(false);
        if (onDone) onDone(accumulated);
        return { text: accumulated, provider, model };
      } catch (err) {
        if (err.name === 'AbortError') {
          setLoading(false);
          if (onDone) onDone(streamText);
          return { text: streamText, aborted: true, provider, model };
        }
        const msg = err.message || 'Unbekannter Streaming-Fehler';
        setError(msg);
        setLoading(false);
        if (onError) onError(msg);
        throw err;
      }
    },
    [activeProvider, activeModel, keys, resolveEndpoint, fetchWithRetry, streamText]
  );

  // ---- Abort ----

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  // ---- Cleanup on unmount ----

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  // ---- Freemium info ----

  const freemiumRemaining = MAX_FREE_PER_DAY - getFreemiumCount();

  // ---- Derived state ----

  const currentProvider = CLOUD_PROVIDERS[activeProvider] ?? null;
  const hasKey = !!keys[activeProvider];
  const availableModels = currentProvider?.defaultModels ?? [];

  return {
    // State
    loading,
    error,
    streamText,
    activeProvider,
    activeModel,
    keys,
    proxyUrl,
    freemiumRemaining,
    currentProvider,
    hasKey,
    availableModels,

    // Actions
    ask,
    askStream,
    abort,
    setActiveProvider,
    setActiveModel,
    setApiKey,
    setProxyUrl,
    clearKeys,

    // Constants
    providers: CLOUD_PROVIDERS,
  };
}
