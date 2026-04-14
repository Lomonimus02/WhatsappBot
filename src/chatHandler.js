const { queries, getAvailableRooms, checkAvailability } = require('./database');
const llm = require('./llm');
const config = require('./config');

// ========== Language detection ==========

function detectLanguage(text) {
  const lower = text.toLowerCase();

  const ptWords = ['olá', 'obrigado', 'por favor', 'quarto', 'reserva', 'bom dia',
    'boa tarde', 'boa noite', 'quanto', 'disponível', 'preço', 'você', 'gostaria',
    'preciso', 'hotel', 'café', 'manhã', 'noite', 'sim', 'não'];
  const esWords = ['hola', 'gracias', 'por favor', 'habitación', 'reserva', 'buenos días',
    'buenas tardes', 'buenas noches', 'cuánto', 'disponible', 'precio', 'usted',
    'quisiera', 'necesito', 'desayuno', 'mañana', 'noche', 'sí', 'cómo'];
  const enWords = ['hello', 'thank', 'please', 'room', 'booking', 'good morning',
    'good afternoon', 'good evening', 'how much', 'available', 'price', 'would like',
    'need', 'breakfast', 'morning', 'night', 'yes', 'check-in', 'check-out'];

  let ptScore = 0, esScore = 0, enScore = 0;
  for (const w of ptWords) if (lower.includes(w)) ptScore++;
  for (const w of esWords) if (lower.includes(w)) esScore++;
  for (const w of enWords) if (lower.includes(w)) enScore++;

  if (ptScore === 0 && esScore === 0 && enScore === 0) return null;
  if (ptScore >= esScore && ptScore >= enScore) return 'pt';
  if (enScore >= esScore && enScore >= ptScore) return 'en';
  return 'es';
}

// ========== Build system prompt with hotel context ==========

function buildSystemPrompt(language) {
  const lang = language || config.bot.defaultLanguage;
  const langSuffix = `_${lang}`;

  // Hotel info
  const hotelInfo = queries.getAllHotelInfo.all();
  const infoMap = {};
  const fallbackLang = lang === 'es' ? 'en' : 'es';
  const fallbackSuffix = `_${fallbackLang}`;
  for (const item of hotelInfo) {
    infoMap[item.key] = item[`value${langSuffix}`] || item[`value${fallbackSuffix}`] || item.value_en || item.value_es || '';
  }

  // Rooms
  const rooms = queries.getActiveRooms.all();
  const nightLabel = { es: 'noche', en: 'night', pt: 'noite' }[lang] || 'night';
  const capacityLabel = { es: 'Capacidad', en: 'Capacity', pt: 'Capacidade' }[lang] || 'Capacity';
  const amenitiesLabel = { es: 'Amenidades', en: 'Amenities', pt: 'Comodidades' }[lang] || 'Amenities';
  const roomDescriptions = rooms.map(r => {
    const desc = r[`description${langSuffix}`] || r[`description${fallbackSuffix}`] || r.description_en || r.description_es || '';
    let amenities = '';
    try { amenities = JSON.parse(r.amenities).join(', '); } catch { amenities = r.amenities; }
    return `- ${r.name} (${r.type}): $${r.price_per_night}/${nightLabel} | ${capacityLabel}: ${r.capacity} | ${desc}${amenities ? ' | ' + amenitiesLabel + ': ' + amenities : ''}`;
  }).join('\n');

  // FAQs
  const faqs = queries.getActiveFaqs.all();
  const faqText = faqs.map(f => {
    const q = f[`question${langSuffix}`] || f[`question${fallbackSuffix}`] || f.question_en || f.question_es || '';
    const a = f[`answer${langSuffix}`] || f[`answer${fallbackSuffix}`] || f.answer_en || f.answer_es || '';
    return q && a ? `Q: ${q}\nA: ${a}` : '';
  }).filter(Boolean).join('\n\n');

  const langNames = { es: 'español', en: 'English', pt: 'português' };
  const langName = langNames[lang] || 'español';

  // Build compact hotel info (only fields that have values)
  const infoLines = [];
  if (infoMap.hotel_name) infoLines.push(`Hotel: ${infoMap.hotel_name}`);
  if (infoMap.address) infoLines.push(`Address: ${infoMap.address}`);
  if (infoMap.phone) infoLines.push(`Phone: ${infoMap.phone}`);
  if (infoMap.email) infoLines.push(`Email: ${infoMap.email}`);
  if (infoMap.website) infoLines.push(`Web: ${infoMap.website}`);
  if (infoMap.check_in_time) infoLines.push(`Check-in: ${infoMap.check_in_time}`);
  if (infoMap.check_out_time) infoLines.push(`Check-out: ${infoMap.check_out_time}`);
  if (infoMap.amenities) infoLines.push(`Amenities: ${infoMap.amenities}`);
  if (infoMap.payment_methods) infoLines.push(`Payment: ${infoMap.payment_methods}`);
  if (infoMap.cancellation_policy) infoLines.push(`Cancellation: ${infoMap.cancellation_policy}`);

  return `You are a friendly hotel receptionist at "${infoMap.hotel_name || 'our hotel'}". You MUST reply ONLY in ${langName}. This is MANDATORY — every single word of your response must be in ${langName}, regardless of the language of the data below. Be warm and natural like a real human. NEVER say you are AI or a bot.

HOTEL INFO:
${infoLines.join('\n')}

ROOMS:
${roomDescriptions || 'No rooms configured.'}

FAQ:
${faqText || 'No FAQs.'}

CRITICAL BOOKING RULES:
1. To make a reservation you MUST collect ALL of these: check-in date, check-out date, number of guests, room type, guest full name.
2. NEVER say "I've booked" or "reservation confirmed" until you have ALL 5 pieces of info.
3. If the guest says "tomorrow" or a relative date, convert it to YYYY-MM-DD format (today is ${new Date().toISOString().split('T')[0]}).
4. If check-out date is not given, ask for it. Do NOT assume.
5. If guest name is not given, ask for it. Do NOT skip.
6. When you have ALL 5 items, you MUST end your message with this EXACT block:

[BOOKING_REQUEST]
room_type: Deluxe Suite
check_in: 2026-04-12
check_out: 2026-04-14
guest_name: John Smith
guests_count: 2
[/BOOKING_REQUEST]

The guest will NOT see the block above. It is processed by our system. If you forget it, the booking will NOT be saved.

RULES: Keep replies SHORT (2-3 sentences for WhatsApp). Use few emojis. Don't invent info not listed above.`;
}

// ========== Process booking request from LLM output ==========

function extractBookingRequest(text) {
  const match = text.match(/\[BOOKING_REQUEST\]([\s\S]*?)\[\/BOOKING_REQUEST\]/);
  if (!match) return null;

  const block = match[1];
  const data = {};
  const lines = block.trim().split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      data[key.trim()] = valueParts.join(':').trim();
    }
  }

  return data;
}

function removeBookingRequest(text) {
  return text.replace(/\[BOOKING_REQUEST\][\s\S]*?\[\/BOOKING_REQUEST\]/, '').trim();
}

// ========== Find best matching room ==========

function findRoomByType(type) {
  const rooms = queries.getActiveRooms.all();
  const lower = type.toLowerCase();

  // Exact match on type or name
  let room = rooms.find(r =>
    r.type.toLowerCase() === lower || r.name.toLowerCase() === lower
  );
  if (room) return room;

  // Partial match
  room = rooms.find(r =>
    r.type.toLowerCase().includes(lower) || r.name.toLowerCase().includes(lower) ||
    lower.includes(r.type.toLowerCase()) || lower.includes(r.name.toLowerCase())
  );
  return room || null;
}

// ========== Fallback booking detection ==========

function looksLikeBookingConfirmation(text) {
  const lower = text.toLowerCase();
  const confirmPhrases = [
    'booked', 'reserved', 'reservation confirmed', 'booking confirmed',
    'reservado', 'reserva confirmada', 'he reservado', 'hemos reservado',
    'reserva registrada', 'reserva realizada',
    'reservado', 'reserva confirmada', 'sua reserva',
  ];
  return confirmPhrases.some(p => lower.includes(p));
}

function extractBookingFromHistory(history, language) {
  // Combine all messages to search for booking-relevant info
  const allText = history.map(m => m.message).join('\n');
  const lower = allText.toLowerCase();

  // Try to find room type
  const rooms = queries.getActiveRooms.all();
  let roomType = null;
  for (const r of rooms) {
    if (lower.includes(r.name.toLowerCase()) || lower.includes(r.type.toLowerCase())) {
      roomType = r.type;
      break;
    }
  }

  // Try to find dates (YYYY-MM-DD)
  const dateMatches = allText.match(/\d{4}-\d{2}-\d{2}/g);

  // Try to find guest count
  const guestMatch = allText.match(/(\d+)\s*(?:people|guests|personas|huéspedes|hóspedes|person)/i);
  const guestsCount = guestMatch ? guestMatch[1] : null;

  // Try to find name (look for capitalized full names in user messages)
  const userMessages = history.filter(m => m.role === 'user').map(m => m.message);
  let guestName = null;
  for (const msg of userMessages) {
    // Look for "My name is X" or "I'm X" patterns
    const nameMatch = msg.match(/(?:my name is|i'm|i am|me llamo|soy|meu nome é)\s+(.+)/i);
    if (nameMatch) {
      guestName = nameMatch[1].trim().replace(/[.,!?]$/, '');
      break;
    }
    // Check if message is just a name (2-3 capitalized words)
    if (/^[A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+){1,2}$/.test(msg.trim())) {
      guestName = msg.trim();
      break;
    }
  }

  // Try "tomorrow" / "mañana" logic
  const today = new Date();
  let checkIn = dateMatches?.[0] || null;
  let checkOut = dateMatches?.[1] || null;

  if (!checkIn && /\b(tomorrow|mañana|amanhã)\b/i.test(allText)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    checkIn = tomorrow.toISOString().split('T')[0];
  }

  if (!roomType) return null; // Can't book without a room

  return {
    room_type: roomType,
    check_in: checkIn,
    check_out: checkOut,
    guest_name: guestName,
    guests_count: guestsCount || '1',
  };
}

// ========== Main message handler ==========

async function handleMessage(phone, text) {
  // Get or detect language
  const history = queries.getConversation.all(phone, config.bot.maxHistoryMessages);
  let language = history.find(m => m.language)?.language || detectLanguage(text) || config.bot.defaultLanguage;

  // Detect language for this specific message (might switch)
  const msgLang = detectLanguage(text);
  if (msgLang) language = msgLang;

  // Save user message
  queries.addMessage.run(phone, 'user', text, language);

  // Build conversation for LLM (oldest first)
  const recentHistory = queries.getConversation
    .all(phone, config.bot.maxHistoryMessages)
    .reverse();

  // Build system prompt
  const systemPrompt = buildSystemPrompt(language);

  try {
    // Call LLM
    const response = await llm.chat(systemPrompt, recentHistory);

    // Check for booking request
    let bookingData = extractBookingRequest(response);
    const cleanResponse = removeBookingRequest(response);

    let finalResponse = cleanResponse;

    // Fallback: if LLM claims it booked but didn't include the block,
    // try to extract booking info from conversation history
    if (!bookingData && looksLikeBookingConfirmation(response)) {
      console.log('⚠️ LLM confirmed booking without [BOOKING_REQUEST] block, attempting extraction...');
      bookingData = extractBookingFromHistory(recentHistory, language);
    }

    if (bookingData) {
      console.log('📋 Booking data extracted:', JSON.stringify(bookingData));
      finalResponse = await processBooking(bookingData, phone, language, cleanResponse);
    }

    // Save assistant response
    queries.addMessage.run(phone, 'assistant', finalResponse, language);

    return finalResponse;
  } catch (error) {
    console.error('Chat handler error:', error.message);

    const errorMessages = {
      es: 'Disculpe, estamos teniendo problemas técnicos. Por favor, intente de nuevo en unos momentos o contáctenos directamente por teléfono. 🙏',
      en: 'Sorry, we are experiencing technical issues. Please try again in a moment or contact us directly by phone. 🙏',
      pt: 'Desculpe, estamos com problemas técnicos. Por favor, tente novamente em alguns momentos ou entre em contato conosco por telefone. 🙏',
    };
    return errorMessages[language] || errorMessages.es;
  }
}

async function processBooking(data, phone, language, llmResponse) {
  const room = findRoomByType(data.room_type || '');

  const missingMsgs = {
    es: {
      noRoom: 'Para completar su reserva, ¿qué tipo de habitación le gustaría? Tenemos: Standard ($85), Superior ($120), Deluxe Suite ($180), y Familiar ($150).',
      noCheckIn: 'Para completar su reserva, ¿cuál sería su fecha de check-in? (por ejemplo: 2026-04-15)',
      noCheckOut: 'Perfecto. ¿Y cuál sería su fecha de check-out?',
      noName: 'Casi listo. ¿Me podría dar su nombre completo para la reserva?',
    },
    en: {
      noRoom: "To complete your booking, which room type would you prefer? We have: Standard ($85), Superior ($120), Deluxe Suite ($180), and Family ($150).",
      noCheckIn: "To complete your booking, what would be your check-in date? (e.g., 2026-04-15)",
      noCheckOut: "Great! And what would be your check-out date?",
      noName: "Almost done! Could you give me your full name for the reservation?",
    },
    pt: {
      noRoom: 'Para completar sua reserva, que tipo de quarto prefere? Temos: Standard ($85), Superior ($120), Deluxe Suite ($180), e Familiar ($150).',
      noCheckIn: 'Para completar sua reserva, qual seria a data de check-in? (exemplo: 2026-04-15)',
      noCheckOut: 'Perfeito. E qual seria a data de check-out?',
      noName: 'Quase pronto! Poderia me dar seu nome completo para a reserva?',
    },
  };
  const mm = missingMsgs[language] || missingMsgs.en;

  if (!room) return mm.noRoom;
  if (!data.check_in) return mm.noCheckIn;
  if (!data.check_out) return mm.noCheckOut;
  if (!data.guest_name) return mm.noName;

  const msgs = {
    es: {
      noAvail: 'Lo siento, esa habitación no está disponible para las fechas seleccionadas. ¿Le gustaría probar con otras fechas u otro tipo de habitación?',
      success: (b) => `¡Excelente! Su reserva ha sido registrada con éxito. 🎉\n\n📋 *Detalles de la reserva:*\n• Habitación: ${b.room_name}\n• Check-in: ${b.check_in}\n• Check-out: ${b.check_out}\n• Huéspedes: ${b.guests_count}\n• Total: $${b.total_price}\n• Estado: Pendiente de confirmación\n\nNuestro equipo le confirmará la reserva a la brevedad. ¿Hay algo más en lo que pueda ayudarle?`,
    },
    en: {
      noAvail: "I'm sorry, that room is not available for the selected dates. Would you like to try different dates or another room type?",
      success: (b) => `Excellent! Your reservation has been registered successfully. 🎉\n\n📋 *Reservation details:*\n• Room: ${b.room_name}\n• Check-in: ${b.check_in}\n• Check-out: ${b.check_out}\n• Guests: ${b.guests_count}\n• Total: $${b.total_price}\n• Status: Pending confirmation\n\nOur team will confirm your reservation shortly. Is there anything else I can help you with?`,
    },
    pt: {
      noAvail: 'Desculpe, esse quarto não está disponível para as datas selecionadas. Gostaria de tentar outras datas ou outro tipo de quarto?',
      success: (b) => `Excelente! Sua reserva foi registrada com sucesso. 🎉\n\n📋 *Detalhes da reserva:*\n• Quarto: ${b.room_name}\n• Check-in: ${b.check_in}\n• Check-out: ${b.check_out}\n• Hóspedes: ${b.guests_count}\n• Total: $${b.total_price}\n• Status: Pendente de confirmação\n\nNossa equipe confirmará sua reserva em breve. Posso ajudar em mais alguma coisa?`,
    },
  };
  const m = msgs[language] || msgs.en;

  const checkIn = data.check_in;
  const checkOut = data.check_out;

  if (!checkAvailability(room.id, checkIn, checkOut)) {
    return m.noAvail;
  }

  // Calculate price
  const days = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
  const totalPrice = days * room.price_per_night;

  const bookingRecord = {
    room_id: room.id,
    guest_name: data.guest_name || 'Guest',
    guest_phone: phone,
    guest_email: '',
    check_in: checkIn,
    check_out: checkOut,
    guests_count: parseInt(data.guests_count) || 1,
    status: 'pending',
    notes: '',
    total_price: totalPrice,
    language: language,
  };

  queries.createBooking.run(bookingRecord);
  console.log(`✅ Booking created: ${room.name} for ${bookingRecord.guest_name}, ${checkIn} → ${checkOut}`);

  return m.success({
    room_name: room.name,
    check_in: checkIn,
    check_out: checkOut,
    guests_count: bookingRecord.guests_count,
    total_price: totalPrice.toFixed(2),
  });
}

module.exports = { handleMessage, detectLanguage };
