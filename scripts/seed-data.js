const { queries } = require('../src/database');

// ========== Hotel Info ==========
const info = {
  hotel_name: {
    es: 'Hotel Palermo Buenos Aires',
    en: 'Hotel Palermo Buenos Aires',
    pt: 'Hotel Palermo Buenos Aires',
  },
  address: {
    es: 'Av. Santa Fe 3520, Palermo, Buenos Aires, Argentina',
    en: 'Av. Santa Fe 3520, Palermo, Buenos Aires, Argentina',
    pt: 'Av. Santa Fe 3520, Palermo, Buenos Aires, Argentina',
  },
  phone: {
    es: '+54 11 4832-5500',
    en: '+54 11 4832-5500',
    pt: '+54 11 4832-5500',
  },
  email: {
    es: 'reservas@hotelpalermoba.com',
    en: 'reservations@hotelpalermoba.com',
    pt: 'reservas@hotelpalermoba.com',
  },
  website: {
    es: 'www.hotelpalermoba.com',
    en: 'www.hotelpalermoba.com',
    pt: 'www.hotelpalermoba.com',
  },
  description: {
    es: 'Hotel boutique de 4 estrellas ubicado en el corazón de Palermo, Buenos Aires. A pasos de los mejores restaurantes, bares y tiendas de diseño. Ambiente acogedor con un toque moderno argentino.',
    en: 'A 4-star boutique hotel located in the heart of Palermo, Buenos Aires. Steps away from the best restaurants, bars, and designer shops. A cozy atmosphere with a modern Argentine touch.',
    pt: 'Hotel boutique de 4 estrelas localizado no coração de Palermo, Buenos Aires. A poucos passos dos melhores restaurantes, bares e lojas de design. Ambiente acolhedor com um toque moderno argentino.',
  },
  check_in_time: {
    es: '14:00',
    en: '2:00 PM',
    pt: '14:00',
  },
  check_out_time: {
    es: '10:00',
    en: '10:00 AM',
    pt: '10:00',
  },
  policies: {
    es: 'No se permite fumar en las habitaciones. Mascotas pequeñas permitidas con cargo adicional de $20/noche. Los niños menores de 6 años se hospedan gratis. Se requiere documento de identidad al hacer check-in.',
    en: 'No smoking in rooms. Small pets allowed with an additional charge of $20/night. Children under 6 stay for free. A valid ID is required at check-in.',
    pt: 'Não é permitido fumar nos quartos. Animais de estimação pequenos são permitidos com taxa adicional de $20/noite. Crianças menores de 6 anos ficam de graça. Documento de identidade necessário no check-in.',
  },
  amenities: {
    es: 'WiFi gratuito, desayuno buffet incluido, piscina en la terraza, gimnasio 24h, spa, servicio de lavandería, estacionamiento privado, room service, recepción 24h, aire acondicionado, caja fuerte',
    en: 'Free WiFi, buffet breakfast included, rooftop pool, 24h gym, spa, laundry service, private parking, room service, 24h reception, air conditioning, safe box',
    pt: 'WiFi gratuito, café da manhã buffet incluído, piscina na cobertura, academia 24h, spa, serviço de lavanderia, estacionamento privado, room service, recepção 24h, ar condicionado, cofre',
  },
  location_info: {
    es: 'Ubicado en Palermo Soho, a 5 minutos caminando de Plaza Serrano. Cerca del Jardín Botánico, Bosques de Palermo y el Museo MALBA. Zona gastronómica y de vida nocturna.',
    en: 'Located in Palermo Soho, a 5-minute walk from Plaza Serrano. Near the Botanical Garden, Palermo Woods, and MALBA Museum. A gastronomic and nightlife area.',
    pt: 'Localizado em Palermo Soho, a 5 minutos a pé da Plaza Serrano. Perto do Jardim Botânico, Bosques de Palermo e Museu MALBA. Zona gastronômica e de vida noturna.',
  },
  transport_info: {
    es: 'Aeropuerto Ezeiza (EZE): 40 min en auto ($35 USD transfer). Aeroparque (AEP): 20 min. Subte línea D estación Plaza Italia a 3 cuadras. Servicio de transfer disponible con reserva previa.',
    en: 'Ezeiza Airport (EZE): 40 min by car ($35 USD transfer). Aeroparque (AEP): 20 min. Subway line D, Plaza Italia station, 3 blocks away. Airport transfer available with prior booking.',
    pt: 'Aeroporto Ezeiza (EZE): 40 min de carro ($35 USD transfer). Aeroparque (AEP): 20 min. Metrô linha D, estação Plaza Italia, a 3 quadras. Serviço de transfer disponível com reserva prévia.',
  },
  payment_methods: {
    es: 'Efectivo (pesos argentinos, USD), tarjetas Visa, Mastercard, American Express. Transferencia bancaria para reservas anticipadas.',
    en: 'Cash (Argentine pesos, USD), Visa, Mastercard, American Express. Bank transfer for advance bookings.',
    pt: 'Dinheiro (pesos argentinos, USD), cartões Visa, Mastercard, American Express. Transferência bancária para reservas antecipadas.',
  },
  cancellation_policy: {
    es: 'Cancelación gratuita hasta 48 horas antes del check-in. Cancelaciones tardías o no-show se cobra la primera noche. Reembolso en 5-10 días hábiles.',
    en: 'Free cancellation up to 48 hours before check-in. Late cancellations or no-shows will be charged for the first night. Refund within 5-10 business days.',
    pt: 'Cancelamento gratuito até 48 horas antes do check-in. Cancelamentos tardios ou no-show serão cobrados pela primeira noite. Reembolso em 5-10 dias úteis.',
  },
};

for (const [key, vals] of Object.entries(info)) {
  queries.updateHotelInfo.run({ key, value_es: vals.es, value_en: vals.en, value_pt: vals.pt });
}
console.log('Hotel info saved');

// ========== Rooms ==========
const rooms = [
  {
    name: 'Standard Room', type: 'standard', price_per_night: 85, capacity: 2, total_units: 8,
    description_es: 'Habitacion confortable con cama doble, bano privado, TV LED 42", aire acondicionado, minibar y vista a la ciudad.',
    description_en: 'Comfortable room with double bed, private bathroom, 42" LED TV, air conditioning, minibar and city view.',
    description_pt: 'Quarto confortavel com cama de casal, banheiro privativo, TV LED 42", ar condicionado, minibar e vista para a cidade.',
    amenities: JSON.stringify(['WiFi', 'TV LED 42"', 'Air Conditioning', 'Minibar', 'Safe', 'Hair Dryer']),
    image_url: '', is_active: 1,
  },
  {
    name: 'Superior Room', type: 'superior', price_per_night: 120, capacity: 2, total_units: 6,
    description_es: 'Habitacion espaciosa con cama king size, sala de estar, bano con banera, balcon privado con vista al jardin.',
    description_en: 'Spacious room with king size bed, living area, bathroom with bathtub, private balcony with garden view.',
    description_pt: 'Quarto espacoso com cama king size, sala de estar, banheiro com banheira, varanda privada com vista para o jardim.',
    amenities: JSON.stringify(['WiFi', 'TV LED 50"', 'Air Conditioning', 'Minibar', 'Safe', 'Bathtub', 'Balcony', 'Coffee Machine']),
    image_url: '', is_active: 1,
  },
  {
    name: 'Deluxe Suite', type: 'suite', price_per_night: 180, capacity: 3, total_units: 4,
    description_es: 'Suite de lujo con dormitorio separado, sala de estar amplia, jacuzzi, terraza privada con vista panoramica a Palermo.',
    description_en: 'Luxury suite with separate bedroom, spacious living room, jacuzzi, private terrace with panoramic Palermo views.',
    description_pt: 'Suite de luxo com quarto separado, ampla sala de estar, jacuzzi, terraco privado com vista panoramica de Palermo.',
    amenities: JSON.stringify(['WiFi', 'TV LED 55"', 'Air Conditioning', 'Minibar', 'Safe', 'Jacuzzi', 'Terrace', 'Coffee Machine', 'Bathrobe', 'Slippers']),
    image_url: '', is_active: 1,
  },
  {
    name: 'Family Room', type: 'family', price_per_night: 150, capacity: 4, total_units: 4,
    description_es: 'Habitacion familiar con cama matrimonial y dos camas individuales, dos banos, amplio espacio para toda la familia.',
    description_en: 'Family room with one double bed and two single beds, two bathrooms, spacious layout for the whole family.',
    description_pt: 'Quarto familiar com cama de casal e duas camas de solteiro, dois banheiros, espaco amplo para toda a familia.',
    amenities: JSON.stringify(['WiFi', 'TV LED 50"', 'Air Conditioning', 'Minibar', 'Safe', '2 Bathrooms', 'Hair Dryer', 'Cribs Available']),
    image_url: '', is_active: 1,
  },
];

for (const r of rooms) {
  queries.createRoom.run(r);
}
console.log('Rooms saved: ' + rooms.length);

// ========== FAQs ==========
const faqs = [
  {
    question_es: 'El desayuno esta incluido?',
    question_en: 'Is breakfast included?',
    question_pt: 'O cafe da manha esta incluido?',
    answer_es: 'Si, todas las habitaciones incluyen desayuno buffet de 7:00 a 10:30 con opciones de medialunas, frutas, cereales, huevos, jugos y cafe.',
    answer_en: 'Yes, all rooms include buffet breakfast from 7:00 to 10:30 AM with croissants, fruits, cereals, eggs, juices and coffee.',
    answer_pt: 'Sim, todos os quartos incluem cafe da manha buffet das 7:00 as 10:30 com croissants, frutas, cereais, ovos, sucos e cafe.',
    sort_order: 1, is_active: 1,
  },
  {
    question_es: 'Tienen estacionamiento?',
    question_en: 'Do you have parking?',
    question_pt: 'Voces tem estacionamento?',
    answer_es: 'Si, contamos con estacionamiento privado cubierto. El costo es de $15 USD por dia. Se recomienda reservar con anticipacion.',
    answer_en: 'Yes, we have a covered private parking. The cost is $15 USD per day. We recommend booking in advance.',
    answer_pt: 'Sim, temos estacionamento privado coberto. O custo e de $15 USD por dia. Recomendamos reservar com antecedencia.',
    sort_order: 2, is_active: 1,
  },
  {
    question_es: 'Aceptan mascotas?',
    question_en: 'Do you accept pets?',
    question_pt: 'Aceitam animais de estimacao?',
    answer_es: 'Si, aceptamos mascotas pequenas (hasta 10 kg) con un cargo adicional de $20 USD por noche. Favor informar al momento de reservar.',
    answer_en: 'Yes, we accept small pets (up to 10 kg) with an additional charge of $20 USD per night. Please inform us when booking.',
    answer_pt: 'Sim, aceitamos animais pequenos (ate 10 kg) com taxa adicional de $20 USD por noite. Por favor, informe ao fazer a reserva.',
    sort_order: 3, is_active: 1,
  },
  {
    question_es: 'Ofrecen servicio de transfer al aeropuerto?',
    question_en: 'Do you offer airport transfer?',
    question_pt: 'Voces oferecem transfer para o aeroporto?',
    answer_es: 'Si, ofrecemos transfer desde/hacia Ezeiza por $35 USD y desde/hacia Aeroparque por $20 USD. Reservar con 24h de anticipacion.',
    answer_en: 'Yes, we offer transfers from/to Ezeiza for $35 USD and from/to Aeroparque for $20 USD. Book at least 24h in advance.',
    answer_pt: 'Sim, oferecemos transfer de/para Ezeiza por $35 USD e de/para Aeroparque por $20 USD. Reservar com 24h de antecedencia.',
    sort_order: 4, is_active: 1,
  },
  {
    question_es: 'Tienen piscina?',
    question_en: 'Do you have a swimming pool?',
    question_pt: 'Voces tem piscina?',
    answer_es: 'Si, tenemos una piscina climatizada en la terraza del ultimo piso con vista panoramica. Abierta de 8:00 a 21:00.',
    answer_en: 'Yes, we have a heated rooftop pool on the top floor with panoramic views. Open from 8:00 AM to 9:00 PM.',
    answer_pt: 'Sim, temos uma piscina climatizada na cobertura com vista panoramica. Aberta das 8:00 as 21:00.',
    sort_order: 5, is_active: 1,
  },
  {
    question_es: 'Cual es la edad minima para hacer check-in?',
    question_en: 'What is the minimum age for check-in?',
    question_pt: 'Qual e a idade minima para fazer check-in?',
    answer_es: 'La edad minima para hacer check-in como huesped principal es 18 anos. Se requiere documento de identidad valido.',
    answer_en: 'The minimum age for check-in as the main guest is 18 years old. A valid ID is required.',
    answer_pt: 'A idade minima para check-in como hospede principal e 18 anos. Documento de identidade valido e necessario.',
    sort_order: 6, is_active: 1,
  },
];

for (const f of faqs) {
  queries.createFaq.run(f);
}
console.log('FAQs saved: ' + faqs.length);

console.log('\nAll hotel data populated successfully!');
