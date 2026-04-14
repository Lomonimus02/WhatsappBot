require('dotenv').config();

module.exports = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'google/gemma-3-27b-it:free',
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
