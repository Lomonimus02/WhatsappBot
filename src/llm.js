const config = require('./config');

const API_KEY = config.openrouter.apiKey;
const MODEL = config.openrouter.model;
const BASE_URL = 'https://openrouter.ai/api/v1';

const FALLBACK_MODELS = [
  config.openrouter.model,
  'google/gemma-4-31b-it:free',
  'google/gemma-3-12b-it:free',
  'google/gemma-3-4b-it:free',
  'openai/gpt-oss-20b:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
];

/**
 * Send a chat completion request to Gemini API
 */
async function callModel(model, systemPrompt, messages, options = {}) {
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.message || m.content })),
    ],
    max_tokens: options.maxTokens || 300,
    temperature: options.temperature || 0.7,
  };

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://github.com/Lomonimus02/WhatsappBot',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`OpenRouter error ${response.status}: ${text}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function chat(systemPrompt, messages, options = {}) {
  const tried = new Set();
  const models = [...new Set([MODEL, ...FALLBACK_MODELS])];

  for (const model of models) {
    if (tried.has(model)) continue;
    tried.add(model);
    try {
      return await callModel(model, systemPrompt, messages, options);
    } catch (err) {
      if (err.status === 429 || err.status === 404) {
        // try next model
        continue;
      }
      throw err;
    }
  }
  throw new Error('All models are rate-limited or unavailable');
}

/**
 * Check if Gemini API is accessible
 */
async function healthCheck() {
  try {
    if (!API_KEY) {
      return { ok: false, error: 'OPENROUTER_API_KEY not set' };
    }

    const res = await fetch(`${BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `OpenRouter API error: ${text}` };
    }

    return { ok: true, model: MODEL, displayName: MODEL };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { chat, healthCheck };
