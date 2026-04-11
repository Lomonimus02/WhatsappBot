const config = require('./config');

const OLLAMA_URL = config.ollama.url;
const MODEL = config.ollama.model;

/**
 * Send a chat completion request to Ollama
 */
async function chat(systemPrompt, messages, options = {}) {
  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.message || m.content })),
  ];

  const body = {
    model: MODEL,
    messages: ollamaMessages,
    stream: false,
    options: {
      temperature: options.temperature || 0.7,
      num_predict: options.maxTokens || 300,
      top_p: 0.9,
      num_ctx: 2048,
    },
  };

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.message?.content || '';
}

/**
 * Check if Ollama is running and the model is available
 */
async function healthCheck() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, error: 'Ollama not responding' };

    const data = await res.json();
    const modelName = MODEL.split(':')[0];
    const hasModel = data.models?.some(m =>
      m.name === MODEL || m.name.startsWith(modelName)
    );

    return {
      ok: true,
      hasModel,
      models: data.models?.map(m => m.name) || [],
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { chat, healthCheck };
