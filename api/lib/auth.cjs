const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'koleya-prod-secret'

function authenticate(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant')
  }
  const token = authHeader.split(' ')[1]
  return jwt.verify(token, JWT_SECRET)
}

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, nom: user.nom, role: user.role, entreprise_id: user.entreprise_id },
    JWT_SECRET,
    { expiresIn: '15m' }
  )
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' })
}

function handler(fn) {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    try {
      const user = authenticate(req)
      req.user = user
      req.entrepriseId = user.entreprise_id
      await fn(req, res)
    } catch (err) {
      if (err.message === 'Token manquant') return res.status(401).json({ error: 'Token manquant' })
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token invalide ou expire' })
      }
      console.error('API Error:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
}

module.exports = { authenticate, generateAccessToken, generateRefreshToken, handler, JWT_SECRET }
