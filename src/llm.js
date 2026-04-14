const config = require('./config');

const API_KEY = config.openrouter.apiKey;
const MODEL = config.openrouter.model;
const BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Send a chat completion request to Gemini API
 */
async function chat(systemPrompt, messages, options = {}) {
  const body = {
    model: MODEL,
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
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
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
