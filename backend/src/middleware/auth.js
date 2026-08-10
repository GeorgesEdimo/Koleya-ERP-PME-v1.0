const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const DEV_SECRET = 'koleya-dev-secret-change-in-production'
const isProd = process.env.NODE_ENV === 'production'

// En production : refuser de démarrer si le secret manque ou reste celui par défaut du dev
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEV_SECRET)) {
  console.error(
    'Configuration invalide : JWT_SECRET est requis et ne doit pas être la valeur de développement en production.'
  )
  process.exit(1)
}

const JWT_SECRET = process.env.JWT_SECRET || DEV_SECRET

// Middleware d'authentification JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    req.entrepriseId = decoded.entreprise_id
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expire', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ error: 'Token invalide' })
  }
}

// Middleware de vérification du rôle
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifie' })
    }
    if (!req.user.est_super_admin && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acces refuse — role insuffisant' })
    }
    next()
  }
}

// Middleware super admin (plateforme)
function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.est_super_admin) {
    return res.status(403).json({ error: 'Acces reserve au super administrateur' })
  }
  next()
}

// Générer un access token (15 min, contient aussi le flag super admin)
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nom: user.nom,
      role: user.role,
      entreprise_id: user.entreprise_id,
      est_super_admin: !!user.est_super_admin,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )
}

// Générer un refresh token (7 jours)
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  )
}

// Hacher un refresh token — on ne stocke jamais le token en clair en base
function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

module.exports = {
  authenticate,
  requireRole,
  requireSuperAdmin,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  JWT_SECRET,
}