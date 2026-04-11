require('dotenv').config();

module.exports = {
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  },
  admin: {
    port: parseInt(process.env.ADMIN_PORT) || 3000,
    sessionSecret: process.env.SESSION_SECRET || 'change-this-secret',
  },
  bot: {
    name: process.env.BOT_NAME || 'Hotel Assistant',
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'es',
    maxHistoryMessages: parseInt(process.env.MAX_HISTORY_MESSAGES) || 20,
    conversationTimeoutHours: parseInt(process.env.CONVERSATION_TIMEOUT_HOURS) || 24,
  },
};
