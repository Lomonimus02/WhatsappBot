const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config');
const { db, queries } = require('./database');
const whatsapp = require('./whatsapp');
const { healthCheck } = require('./llm');
const { createAdmin } = require('./admin/auth');
const adminRoutes = require('./admin/routes');

const app = express();

// ========== Middleware ==========
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: config.admin.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax',
  },
}));

// ========== View Engine ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'admin', 'views'));

// ========== Routes ==========
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.redirect('/admin');
});

// ========== Start ==========
async function start() {
  console.log('🏨 Hotel WhatsApp Bot starting...\n');

  // Ensure at least one admin exists
  const admin = queries.getAdmin.get('admin');
  if (!admin) {
    await createAdmin('admin', 'admin123');
    console.log('👤 Default admin created: admin / admin123');
    console.log('   ⚠️  Change the password after first login!\n');
  }

  // Check Gemini
  const gemini = await healthCheck();
  if (gemini.ok) {
    console.log('🤖 Gemini API is active');
    console.log(`   Model: ${gemini.displayName || config.gemini.model} ✅`);
  } else {
    console.log('⚠️  Gemini API error:', gemini.error);
    console.log('   Set GEMINI_API_KEY in .env');
  }

  // Start Express
  app.listen(config.admin.port, () => {
    console.log(`\n🌐 Admin panel: http://localhost:${config.admin.port}/admin`);
    console.log(`   Login: admin / admin123\n`);
  });

  // Start WhatsApp
  console.log('📱 Starting WhatsApp...');
  try {
    await whatsapp.initialize();
  } catch (err) {
    console.error('Error starting WhatsApp:', err.message);
    console.log('   The bot will keep trying to connect.');
  }

  // Periodic cleanup of old conversations
  setInterval(() => {
    try {
      queries.clearOldConversations.run(`-${config.bot.conversationTimeoutHours}`);
    } catch (e) {
      // ignore
    }
  }, 60 * 60 * 1000); // every hour
}

start().catch(console.error);
