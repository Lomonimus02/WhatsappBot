const config = require('./config');

const API_KEY = config.gemini.apiKey;
const MODEL = config.gemini.model;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Send a chat completion request to Gemini API
 */
async function chat(systemPrompt, messages, options = {}) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.message || m.content }],
  }));

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.maxTokens || 300,
      topP: 0.9,
    },
  };

  const url = `${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Check if Gemini API is accessible
 */
async function healthCheck() {
  try {
    if (!API_KEY) {
      return { ok: false, error: 'GEMINI_API_KEY not set' };
    }

    const url = `${BASE_URL}/models/${MODEL}?key=${API_KEY}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Gemini API error: ${text}` };
    }

    const data = await res.json();
    return {
      ok: true,
      model: data.name || MODEL,
      displayName: data.displayName || MODEL,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { chat, healthCheck };
