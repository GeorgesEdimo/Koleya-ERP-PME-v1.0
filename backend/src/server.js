require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { closePool } = require('./config/database')

const authRoutes = require('./routes/auth')
const clientRoutes = require('./routes/clients')
const factureRoutes = require('./routes/factures')
const creditRoutes = require('./routes/credits')
const produitRoutes = require('./routes/produits')
const employeRoutes = require('./routes/employes')
const depenseRoutes = require('./routes/depenses')
const statsRoutes = require('./routes/stats')
const notificationRoutes = require('./routes/notifications')
const stockAvanceRoutes = require('./routes/stockAvance')
const comptabiliteRoutes = require('./routes/comptabilite')
const paiementRoutes = require('./routes/paiements')
const abonnementRoutes = require('./routes/abonnement')
const adminRoutes = require('./routes/admin')
const documentsRoutes = require('./routes/documents')
const twoFactorRoutes = require('./routes/twoFactor')

const isProd = process.env.NODE_ENV === 'production'

// =============================================
// CONFIG STRICTE (refuser de démarrer en prod si secrets manquants)
// =============================================
if (isProd) {
  const requis = ['JWT_SECRET', 'DB_PASSWORD']
  const manquants = requis.filter((k) => !process.env[k])
  if (manquants.length > 0) {
    console.error('Configuration invalide en production — variables manquantes :', manquants.join(', '))
    process.exit(1)
  }
}

const app = express()
const PORT = process.env.PORT || 3001

// Derrière Nginx/Caddy : le client réel est dans X-Forwarded-For (nécessaire au rate limiting)
app.set('trust proxy', 1)

// =============================================
// MIDDLEWARE GLOBAL
// =============================================

// Sécurité (CSP directives)
app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            workerSrc: ["'self'", 'blob:'],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    hsts: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
)

// CORS restreint
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
  })
)

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting global (100 requêtes / 15min / IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // marge pour ~100 utilisateurs simultanés derrière un proxy
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' },
})
app.use('/api/', limiter)

// Rate limiting plus strict pour l'auth (anti bruteforce)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion.' },
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)

// =============================================
// ROUTES
// =============================================

app.use('/api/auth', authRoutes)
app.use('/api/abonnement', abonnementRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/factures', factureRoutes)
app.use('/api/credits', creditRoutes)
app.use('/api/produits', produitRoutes)
app.use('/api/employes', employeRoutes)
app.use('/api/depenses', depenseRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/stock-avance', stockAvanceRoutes)
app.use('/api/comptabilite', comptabiliteRoutes)
app.use('/api/paiements', paiementRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/auth', twoFactorRoutes)

// Health check (sans dépendance BD)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' })
})

// Error handler central
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err)
  res.status(500).json({ error: 'Erreur interne du serveur' })
})

// =============================================
// DEMARRAGE + ARRET GRACIEUX
// =============================================
const server = app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   Koleya API — ERP PME              ║
  ║   Port: ${PORT}                       ║
  ║   Env: ${process.env.NODE_ENV || 'development'}                    ║
  ╚══════════════════════════════════════╝
  `)
})

// Fermeture propre : on arrête d'accepter des requêtes, on vide le pool, puis on sort
function shutdown(signal) {
  console.log(`\n${signal} reçu, arrêt en cours…`)
  server.close(async () => {
    try {
      await closePool()
    } finally {
      process.exit(0)
    }
  })
  // Sécurité : force l'arrêt après 10s
  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

module.exports = app