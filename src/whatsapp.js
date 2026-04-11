const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./chatHandler');

let client = null;
let isReady = false;
let qrCode = null;

function createClient() {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', (qr) => {
    qrCode = qr;
    console.log('\n📱 Escanea este código QR con WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log('También disponible en el panel de admin: /admin/whatsapp\n');
  });

  client.on('ready', () => {
    isReady = true;
    qrCode = null;
    console.log('✅ WhatsApp conectado y listo!');
  });

  client.on('authenticated', () => {
    console.log('🔐 WhatsApp autenticado');
  });

  client.on('auth_failure', (msg) => {
    isReady = false;
    console.error('❌ Error de autenticación WhatsApp:', msg);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    console.log('📴 WhatsApp desconectado:', reason);
    // Auto-reconnect after 5s
    setTimeout(() => {
      console.log('🔄 Reintentando conexión...');
      client.initialize().catch(console.error);
    }, 5000);
  });

  // Message handler — use message_create for reliable incoming detection
  client.on('message_create', async (msg) => {
    // Debug: log every event to verify messages are arriving
    console.log(`📩 Event: from=${msg.from}, fromMe=${msg.fromMe}, type=${msg.type}, hasBody=${!!msg.body}`);

    // Ignore own messages
    if (msg.fromMe) return;

    // Ignore group messages and status updates
    if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') {
      return;
    }

    // Only process text messages
    if (msg.type !== 'chat') return;

    const phone = msg.from.replace(/@(c\.us|lid)$/, '');
    const text = msg.body.trim();

    if (!text) return;

    console.log(`💬 [${phone}]: ${text.substring(0, 100)}`);

    try {
      const response = await handleMessage(phone, text);
      if (response) {
        await msg.reply(response);
        console.log(`🤖 [→${phone}]: ${response.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error(`Error handling message from ${phone}:`, error);
    }
  });

  return client;
}

function initialize() {
  if (!client) createClient();
  return client.initialize();
}

function getStatus() {
  return {
    isReady,
    qrCode,
    info: isReady && client?.info ? {
      pushname: client.info.pushname,
      phone: client.info.wid?.user,
    } : null,
  };
}

function getClient() {
  return client;
}

module.exports = { initialize, getStatus, getClient };
