const express = require('express');
const { requireAuth, login, createAdmin } = require('./auth');
const { queries, db, checkAvailability } = require('../database');
const { getStatus } = require('../whatsapp');
const { healthCheck } = require('../llm');

const router = express.Router();

// ========== Login ==========

router.get('/login', (req, res) => {
  if (req.session?.adminId) return res.redirect('/admin');
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await login(username, password);
  if (admin) {
    req.session.adminId = admin.id;
    req.session.adminUser = admin.username;
    return res.redirect('/admin');
  }
  res.render('login', { error: 'Invalid username or password' });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ========== Auth barrier ==========
router.use(requireAuth);

// ========== Dashboard ==========

router.get('/', async (req, res) => {
  const stats = {
    rooms: queries.countRooms.get().count,
    bookings: queries.countBookings.get().count,
    pending: queries.countPendingBookings.get().count,
    conversations: queries.countConversations.get().count,
  };
  const recentBookings = queries.recentBookings.all();
  const whatsapp = getStatus();
  const ollama = await healthCheck();

  res.render('dashboard', {
    stats, recentBookings, whatsapp, ollama,
    admin: req.session.adminUser,
    page: 'dashboard',
  });
});

// ========== Rooms ==========

router.get('/rooms', (req, res) => {
  const rooms = queries.getAllRooms.all();
  res.render('rooms', { rooms, admin: req.session.adminUser, page: 'rooms' });
});

router.get('/rooms/new', (req, res) => {
  res.render('room-form', {
    room: null, admin: req.session.adminUser, page: 'rooms', error: null,
  });
});

router.get('/rooms/:id/edit', (req, res) => {
  const room = queries.getRoomById.get(req.params.id);
  if (!room) return res.redirect('/admin/rooms');
  res.render('room-form', {
    room, admin: req.session.adminUser, page: 'rooms', error: null,
  });
});

router.post('/rooms', (req, res) => {
  const data = parseRoomForm(req.body);
  try {
    if (req.body.id) {
      data.id = parseInt(req.body.id);
      queries.updateRoom.run(data);
    } else {
      queries.createRoom.run(data);
    }
    res.redirect('/admin/rooms');
  } catch (err) {
    const room = req.body.id ? queries.getRoomById.get(req.body.id) : null;
    res.render('room-form', {
      room: { ...data, id: req.body.id },
      admin: req.session.adminUser, page: 'rooms', error: err.message,
    });
  }
});

router.post('/rooms/:id/delete', (req, res) => {
  queries.deleteRoom.run(req.params.id);
  res.redirect('/admin/rooms');
});

function parseRoomForm(body) {
  return {
    name: body.name || '',
    type: body.type || 'standard',
    description_es: body.description_es || '',
    description_en: body.description_en || '',
    description_pt: body.description_pt || '',
    price_per_night: parseFloat(body.price_per_night) || 0,
    capacity: parseInt(body.capacity) || 2,
    total_units: parseInt(body.total_units) || 1,
    amenities: body.amenities || '[]',
    image_url: body.image_url || '',
    is_active: body.is_active ? 1 : 0,
  };
}

// ========== Bookings ==========

router.get('/bookings', (req, res) => {
  const bookings = queries.getAllBookings.all();
  res.render('bookings', { bookings, admin: req.session.adminUser, page: 'bookings' });
});

router.post('/bookings/:id/status', (req, res) => {
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  const status = req.body.status;
  if (validStatuses.includes(status)) {
    queries.updateBookingStatus.run(status, req.params.id);
  }
  res.redirect('/admin/bookings');
});

router.post('/bookings/:id/delete', (req, res) => {
  queries.deleteBooking.run(req.params.id);
  res.redirect('/admin/bookings');
});

// ========== Hotel Info ==========

router.get('/hotel-info', (req, res) => {
  const info = queries.getAllHotelInfo.all();
  res.render('hotel-info', { info, admin: req.session.adminUser, page: 'hotel-info' });
});

router.post('/hotel-info', (req, res) => {
  const info = queries.getAllHotelInfo.all();
  for (const item of info) {
    queries.updateHotelInfo.run({
      key: item.key,
      value_es: req.body[`${item.key}_es`] || '',
      value_en: req.body[`${item.key}_en`] || '',
      value_pt: req.body[`${item.key}_pt`] || '',
    });
  }
  res.redirect('/admin/hotel-info');
});

// ========== FAQs ==========

router.get('/faqs', (req, res) => {
  const faqs = queries.getAllFaqs.all();
  res.render('faqs', { faqs, admin: req.session.adminUser, page: 'faqs' });
});

router.get('/faqs/new', (req, res) => {
  res.render('faq-form', {
    faq: null, admin: req.session.adminUser, page: 'faqs', error: null,
  });
});

router.get('/faqs/:id/edit', (req, res) => {
  const faq = queries.getFaqById.get(req.params.id);
  if (!faq) return res.redirect('/admin/faqs');
  res.render('faq-form', {
    faq, admin: req.session.adminUser, page: 'faqs', error: null,
  });
});

router.post('/faqs', (req, res) => {
  const data = {
    question_es: req.body.question_es || '',
    question_en: req.body.question_en || '',
    question_pt: req.body.question_pt || '',
    answer_es: req.body.answer_es || '',
    answer_en: req.body.answer_en || '',
    answer_pt: req.body.answer_pt || '',
    sort_order: parseInt(req.body.sort_order) || 0,
    is_active: req.body.is_active ? 1 : 0,
  };

  try {
    if (req.body.id) {
      data.id = parseInt(req.body.id);
      queries.updateFaq.run(data);
    } else {
      queries.createFaq.run(data);
    }
    res.redirect('/admin/faqs');
  } catch (err) {
    res.render('faq-form', {
      faq: { ...data, id: req.body.id },
      admin: req.session.adminUser, page: 'faqs', error: err.message,
    });
  }
});

router.post('/faqs/:id/delete', (req, res) => {
  queries.deleteFaq.run(req.params.id);
  res.redirect('/admin/faqs');
});

// ========== WhatsApp Status ==========

router.get('/whatsapp', async (req, res) => {
  const status = getStatus();
  const ollama = await healthCheck();
  res.render('whatsapp-status', {
    status, ollama, admin: req.session.adminUser, page: 'whatsapp',
  });
});

// ========== API endpoints for AJAX ==========

router.get('/api/whatsapp-status', (req, res) => {
  res.json(getStatus());
});

router.get('/api/ollama-status', async (req, res) => {
  res.json(await healthCheck());
});

module.exports = router;
