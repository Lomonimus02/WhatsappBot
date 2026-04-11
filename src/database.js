const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'hotel.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ========== Schema ==========

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'standard',
    description_es TEXT DEFAULT '',
    description_en TEXT DEFAULT '',
    description_pt TEXT DEFAULT '',
    price_per_night REAL NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 2,
    total_units INTEGER NOT NULL DEFAULT 1,
    amenities TEXT DEFAULT '[]',
    image_url TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER REFERENCES rooms(id),
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_email TEXT DEFAULT '',
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    notes TEXT DEFAULT '',
    total_price REAL DEFAULT 0,
    language TEXT DEFAULT 'es',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS hotel_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    value_es TEXT DEFAULT '',
    value_en TEXT DEFAULT '',
    value_pt TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_es TEXT DEFAULT '',
    question_en TEXT DEFAULT '',
    question_pt TEXT DEFAULT '',
    answer_es TEXT DEFAULT '',
    answer_en TEXT DEFAULT '',
    answer_pt TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    message TEXT NOT NULL,
    language TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
`);

// ========== Seed hotel_info defaults ==========

const infoDefaults = [
  { key: 'hotel_name', label: 'Nombre del Hotel / Hotel Name' },
  { key: 'address', label: 'Dirección / Address' },
  { key: 'phone', label: 'Teléfono / Phone' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Sitio Web / Website' },
  { key: 'description', label: 'Descripción / Description' },
  { key: 'check_in_time', label: 'Hora de Check-in' },
  { key: 'check_out_time', label: 'Hora de Check-out' },
  { key: 'policies', label: 'Políticas / Policies' },
  { key: 'amenities', label: 'Servicios / Amenities' },
  { key: 'location_info', label: 'Ubicación / Location Info' },
  { key: 'transport_info', label: 'Transporte / Transport Info' },
  { key: 'payment_methods', label: 'Métodos de Pago / Payment Methods' },
  { key: 'cancellation_policy', label: 'Política de Cancelación / Cancellation Policy' },
];

const insertInfo = db.prepare(
  `INSERT OR IGNORE INTO hotel_info (key, label, sort_order) VALUES (?, ?, ?)`
);
for (let i = 0; i < infoDefaults.length; i++) {
  insertInfo.run(infoDefaults[i].key, infoDefaults[i].label, i);
}

// ========== Query helpers ==========

const queries = {
  // --- Admins ---
  getAdmin: db.prepare('SELECT * FROM admins WHERE username = ?'),
  createAdmin: db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)'),

  // --- Rooms ---
  getAllRooms: db.prepare('SELECT * FROM rooms ORDER BY id'),
  getActiveRooms: db.prepare('SELECT * FROM rooms WHERE is_active = 1 ORDER BY id'),
  getRoomById: db.prepare('SELECT * FROM rooms WHERE id = ?'),
  createRoom: db.prepare(`
    INSERT INTO rooms (name, type, description_es, description_en, description_pt,
      price_per_night, capacity, total_units, amenities, image_url, is_active)
    VALUES (@name, @type, @description_es, @description_en, @description_pt,
      @price_per_night, @capacity, @total_units, @amenities, @image_url, @is_active)
  `),
  updateRoom: db.prepare(`
    UPDATE rooms SET name=@name, type=@type, description_es=@description_es,
      description_en=@description_en, description_pt=@description_pt,
      price_per_night=@price_per_night, capacity=@capacity, total_units=@total_units,
      amenities=@amenities, image_url=@image_url, is_active=@is_active
    WHERE id=@id
  `),
  deleteRoom: db.prepare('DELETE FROM rooms WHERE id = ?'),

  // --- Bookings ---
  getAllBookings: db.prepare('SELECT b.*, r.name as room_name FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id ORDER BY b.created_at DESC'),
  getBookingById: db.prepare('SELECT b.*, r.name as room_name FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id WHERE b.id = ?'),
  getBookingsByPhone: db.prepare('SELECT b.*, r.name as room_name FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id WHERE b.guest_phone = ? ORDER BY b.created_at DESC'),
  createBooking: db.prepare(`
    INSERT INTO bookings (room_id, guest_name, guest_phone, guest_email,
      check_in, check_out, guests_count, status, notes, total_price, language)
    VALUES (@room_id, @guest_name, @guest_phone, @guest_email,
      @check_in, @check_out, @guests_count, @status, @notes, @total_price, @language)
  `),
  updateBookingStatus: db.prepare('UPDATE bookings SET status = ? WHERE id = ?'),
  deleteBooking: db.prepare('DELETE FROM bookings WHERE id = ?'),

  // --- Hotel Info ---
  getAllHotelInfo: db.prepare('SELECT * FROM hotel_info ORDER BY sort_order'),
  getHotelInfoByKey: db.prepare('SELECT * FROM hotel_info WHERE key = ?'),
  updateHotelInfo: db.prepare(`
    UPDATE hotel_info SET value_es=@value_es, value_en=@value_en, value_pt=@value_pt,
      updated_at=CURRENT_TIMESTAMP WHERE key=@key
  `),

  // --- FAQs ---
  getAllFaqs: db.prepare('SELECT * FROM faqs ORDER BY sort_order, id'),
  getActiveFaqs: db.prepare('SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order, id'),
  getFaqById: db.prepare('SELECT * FROM faqs WHERE id = ?'),
  createFaq: db.prepare(`
    INSERT INTO faqs (question_es, question_en, question_pt, answer_es, answer_en, answer_pt, sort_order, is_active)
    VALUES (@question_es, @question_en, @question_pt, @answer_es, @answer_en, @answer_pt, @sort_order, @is_active)
  `),
  updateFaq: db.prepare(`
    UPDATE faqs SET question_es=@question_es, question_en=@question_en, question_pt=@question_pt,
      answer_es=@answer_es, answer_en=@answer_en, answer_pt=@answer_pt,
      sort_order=@sort_order, is_active=@is_active WHERE id=@id
  `),
  deleteFaq: db.prepare('DELETE FROM faqs WHERE id = ?'),

  // --- Conversations ---
  getConversation: db.prepare(
    'SELECT * FROM conversations WHERE phone = ? ORDER BY created_at DESC LIMIT ?'
  ),
  addMessage: db.prepare(
    'INSERT INTO conversations (phone, role, message, language) VALUES (?, ?, ?, ?)'
  ),
  clearConversation: db.prepare('DELETE FROM conversations WHERE phone = ?'),
  clearOldConversations: db.prepare(
    `DELETE FROM conversations WHERE created_at < datetime('now', ? || ' hours')`
  ),

  // --- Stats ---
  countRooms: db.prepare('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1'),
  countBookings: db.prepare('SELECT COUNT(*) as count FROM bookings'),
  countPendingBookings: db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'"),
  countConversations: db.prepare('SELECT COUNT(DISTINCT phone) as count FROM conversations'),
  recentBookings: db.prepare('SELECT b.*, r.name as room_name FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id ORDER BY b.created_at DESC LIMIT 10'),
};

// ========== Availability check ==========

function checkAvailability(roomId, checkIn, checkOut, excludeBookingId = null) {
  let query = `
    SELECT COUNT(*) as booked FROM bookings
    WHERE room_id = ? AND status != 'cancelled'
      AND check_in < ? AND check_out > ?
  `;
  const params = [roomId, checkOut, checkIn];

  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }

  const room = queries.getRoomById.get(roomId);
  if (!room) return false;

  const result = db.prepare(query).get(...params);
  return result.booked < room.total_units;
}

function getAvailableRooms(checkIn, checkOut) {
  const rooms = queries.getActiveRooms.all();
  return rooms.filter(room => checkAvailability(room.id, checkIn, checkOut));
}

module.exports = { db, queries, checkAvailability, getAvailableRooms };
