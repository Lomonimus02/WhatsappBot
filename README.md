# 🏨 WhatsApp Hotel Bot

Bot de WhatsApp para hotel con soporte multilingüe (Español, English, Português) basado en IA local (Ollama).

## Características

- 💬 **Chat natural** — responde como un humano usando LLM local
- 🌍 **Multilingüe** — español, inglés, portugués (detecta idioma automáticamente)
- 📅 **Reservas** — los huéspedes pueden reservar habitaciones por WhatsApp
- 🛏️ **Gestión de habitaciones** — CRUD con descripciones multilingüe
- ❓ **FAQs** — preguntas frecuentes configurables
- 🔒 **Admin panel** — interfaz web protegida por contraseña
- 🤖 **Ollama** — funciona 100% local, sin APIs externas

## Requisitos

1. **Node.js** 18+
2. **Ollama** — [ollama.ai](https://ollama.ai)
3. **WhatsApp** — número de teléfono con WhatsApp

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Instalar y configurar Ollama
# Descargar desde https://ollama.ai
ollama pull llama3.1:8b

# 3. Copiar configuración
cp .env.example .env
# Editar .env según necesidades

# 4. Iniciar
npm start
```

## Primer Inicio

1. Ejecutar `npm start`
2. Abrir el admin panel: http://localhost:3000/admin
3. Login: `admin` / `admin123` (¡cambiar después!)
4. Escanear el código QR con WhatsApp
5. Configurar la información del hotel en "Info del Hotel"
6. Agregar habitaciones en "Habitaciones"
7. Agregar FAQs (opcional)

## Configuración (.env)

| Variable | Descripción | Default |
|---|---|---|
| `OLLAMA_URL` | URL de Ollama | `http://localhost:11434` |
| `OLLAMA_MODEL` | Modelo LLM | `llama3.1:8b` |
| `ADMIN_PORT` | Puerto del admin panel | `3000` |
| `SESSION_SECRET` | Clave para sesiones | (cambiar) |
| `MAX_HISTORY_MESSAGES` | Mensajes de contexto | `20` |
| `CONVERSATION_TIMEOUT_HOURS` | Limpiar conversaciones | `24` |

## Modelos Recomendados

| Modelo | RAM | Idiomas | Velocidad |
|---|---|---|---|
| `llama3.1:8b` | ~5GB | ✅ Excelente | Rápido |
| `mistral:7b` | ~4GB | ✅ Bueno | Rápido |
| `llama3.1:70b` | ~40GB | ✅ Mejor | Lento |
| `gemma2:9b` | ~6GB | ✅ Bueno | Rápido |

## Estructura

```
├── src/
│   ├── index.js          # Punto de entrada
│   ├── config.js         # Configuración
│   ├── database.js       # SQLite + esquema
│   ├── llm.js            # Integración Ollama
│   ├── chatHandler.js    # Lógica del chat + reservas
│   ├── whatsapp.js       # Cliente WhatsApp
│   ├── admin/
│   │   ├── auth.js       # Autenticación
│   │   ├── routes.js     # Rutas admin
│   │   └── views/        # Templates EJS
│   └── public/           # CSS, JS estáticos
├── data/                 # Base de datos (auto-creado)
├── scripts/
│   └── create-admin.js   # Crear admin por CLI
└── .env                  # Configuración
```

## Crear Admin Adicional

```bash
node scripts/create-admin.js <usuario> <contraseña>
```
