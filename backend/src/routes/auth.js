const express = require('express')
const bcrypt = require('bcryptjs')
const { query } = require('../config/database')
const {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  JWT_SECRET,
} = require('../middleware/auth')
const { validate, signupSchema, loginSchema } = require('../middleware/validation')

const router = express.Router()

const JOURS_ESSAI = 7

// =============================================
// POST /api/auth/signup — crée l'entreprise + compte propriétaire + essai 7 jours
// =============================================
router.post('/signup', validate(signupSchema), async (req, res) => {
  try {
    const { email, mot_de_passe, nom, telephone, entreprise_nom } = req.body

    // Vérifier si l'email existe déjà
    const existing = await query('SELECT id FROM utilisateurs WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' })
    }

    // Créer l'entreprise (essai gratuit de 7 jours)
    const entreprise = await query(
      `INSERT INTO entreprises (nom, telephone, email, plan, essai_active, essai_fin)
       VALUES ($1, $2, $3, 'starter', true, NOW() + INTERVAL '${JOURS_ESSAI} days')
       RETURNING id, nom, plan, essai_fin, essai_active`,
      [entreprise_nom || nom, telephone, email]
    )

    // Hasher le mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 12)

    // Créer l'utilisateur (propriétaire)
    const user = await query(
      `INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role)
       VALUES ($1, $2, $3, $4, $5, 'proprietaire')
       RETURNING id, email, nom, telephone, role, entreprise_id, est_super_admin, cree_le`,
      [entreprise.rows[0].id, email, hash, nom, telephone]
    )

    // Générer les tokens — on stocke SEULEMENT le hash du refresh token
    const accessToken = generateAccessToken(user.rows[0])
    const refreshToken = generateRefreshToken(user.rows[0])
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await query(
      'INSERT INTO refresh_tokens (utilisateur_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.rows[0].id, hashRefreshToken(refreshToken), expiresAt]
    )

    res.status(201).json({
      user: user.rows[0],
      entreprise: entreprise.rows[0],
      accessToken,
      refreshToken,
    })
  } catch (err) {
    console.error('Erreur signup:', err)
    res.status(500).json({ error: 'Erreur lors de l\'inscription' })
  }
})

// =============================================
// POST /api/auth/login
// =============================================
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body

    const result = await query(
      `SELECT u.*, e.nom AS entreprise_nom, e.plan
       FROM utilisateurs u
       JOIN entreprises e ON u.entreprise_id = e.id
       WHERE u.email = $1 AND u.actif = true`,
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe)

    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    // Mettre à jour la dernière connexion
    await query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1', [user.id])

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await query(
      'INSERT INTO refresh_tokens (utilisateur_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, hashRefreshToken(refreshToken), expiresAt]
    )

    res.json({
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        telephone: user.telephone,
        role: user.role,
        entreprise_id: user.entreprise_id,
        est_super_admin: !!user.est_super_admin,
      },
      entreprise: {
        id: user.entreprise_id,
        nom: user.entreprise_nom,
        plan: user.plan,
      },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    console.error('Erreur login:', err)
    res.status(500).json({ error: 'Erreur lors de la connexion' })
  }
})

// =============================================
// POST /api/auth/refresh — rotation du refresh token (révocation de l'ancien)
// =============================================
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requis' })
    }

    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(refreshToken, JWT_SECRET)
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token invalide' })
    }

    const hash = hashRefreshToken(refreshToken)

    // Vérifier que le token (hashé) existe en base et n'est pas expiré
    const result = await query(
      `SELECT u.*
       FROM refresh_tokens rt
       JOIN utilisateurs u ON rt.utilisateur_id = u.id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [hash]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Token expiré ou révoqué' })
    }

    const user = result.rows[0]

    // Rotation : révoquer l'ancien refresh token, en émettre un nouveau
    await query('DELETE FROM refresh_tokens WHERE token = $1', [hash])
    const newRefreshToken = generateRefreshToken(user)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await query(
      'INSERT INTO refresh_tokens (utilisateur_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, hashRefreshToken(newRefreshToken), expiresAt]
    )

    res.json({
      accessToken: generateAccessToken(user),
      refreshToken: newRefreshToken,
    })
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token invalide' })
  }
})

// =============================================
// POST /api/auth/logout — révocation par hash
// =============================================
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [hashRefreshToken(refreshToken)])
    }
    res.json({ message: 'Déconnexion réussie' })
  } catch (err) {
    res.json({ message: 'Déconnexion réussie' })
  }
})

// =============================================
// GET /api/auth/me
// =============================================
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.nom, u.telephone, u.role, u.entreprise_id, u.est_super_admin,
              e.nom AS entreprise_nom, e.plan
       FROM utilisateurs u
       JOIN entreprises e ON u.entreprise_id = e.id
       WHERE u.id = $1`,
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    res.json({ user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router