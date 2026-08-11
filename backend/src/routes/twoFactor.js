const express = require('express')
const jwt = require('jsonwebtoken')
const { query } = require('../config/database')
const { authenticate, generateAccessToken } = require('../lib/auth')
const twoFactorService = require('../services/twoFactorService')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'koleya-dev-secret-change-in-production'

// =============================================
// 2FA — Activer le 2FA
// =============================================
router.post('/2fa/activer', authenticate, async (req, res) => {
  try {
    const { canal } = req.body // 'sms' ou 'email'
    const user = await query('SELECT telephone, email FROM utilisateurs WHERE id = $1', [req.user.id])
    if (user.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouve' })

    const telephone = user.rows[0].telephone
    const destinataire = canal === 'email' ? user.rows[0].email : telephone

    await twoFactorService.envoyerCode2FA(req.user.id, destinataire, canal)

    // Mettre a jour le profil
    await query(
      'UPDATE utilisateurs SET two_factor_active = true, two_factor_canal = $1 WHERE id = $2',
      [canal || 'sms', req.user.id]
    )

    res.json({ message: `Code 2FA envoye par ${canal || 'sms'}`, expires_in: 300 })
  } catch (err) {
    console.error('Erreur 2FA activer:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// 2FA — Verifier le code
// =============================================
router.post('/2fa/verifier', authenticate, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Code requis' })

    const result = await twoFactorService.verifierCode2FA(req.user.id, code)
    if (!result.succes) {
      return res.status(401).json({ error: result.erreur })
    }

    // Mettre a jour la derniere connexion
    await query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1', [req.user.id])

    // Generer un nouveau token avec flag 2FA verifie
    const accessToken = jwt.sign(
      { ...req.user, two_factor_verified: true },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    res.json({ message: '2FA verifie', accessToken })
  } catch (err) {
    console.error('Erreur 2FA verifier:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// 2FA — Desactiver
// =============================================
router.post('/2fa/desactiver', authenticate, async (req, res) => {
  try {
    await query('UPDATE utilisateurs SET two_factor_active = false WHERE id = $1', [req.user.id])
    res.json({ message: '2FA desactive' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// GMAIL OAUTH — Initier la connexion Google
// =============================================
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3001'}/api/auth/google/callback`
  const scope = 'email profile'

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline`

  res.redirect(url)
})

// GMAIL OAUTH — Callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`)

    // Echanger le code contre un token (simulation en dev)
    // En prod : appeler Google OAuth API
    // const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { ... })
    // const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } })

    // Simulation avec les donnees du code
    const googleId = `google_${Date.now()}`
    const email = `user_${Date.now()}@gmail.com`
    const nom = 'Utilisateur Google'

    // Chercher ou creer l'utilisateur
    let user = await query('SELECT * FROM utilisateurs WHERE google_id = $1', [googleId])

    if (user.rows.length === 0) {
      // Creer une entreprise par defaut
      const entreprise = await query(
        "INSERT INTO entreprises (nom, telephone, email) VALUES ($1, $2, $3) RETURNING *",
        [nom, '', email]
      )
      user = await query(
        `INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, google_id, role)
         VALUES ($1, $2, $3, $4, $5, 'proprietaire')
         RETURNING id, email, nom, telephone, role, entreprise_id`,
        [entreprise.rows[0].id, email, '$2a$12$placeholder', nom, googleId]
      )
    }

    const accessToken = generateAccessToken(user.rows[0])
    const refreshToken = require('../lib/auth').generateRefreshToken(user.rows[0])

    // Rediriger vers le frontend avec les tokens
    res.redirect(`${process.env.FRONTEND_URL}/app?token=${accessToken}`)
  } catch (err) {
    console.error('Erreur Google callback:', err)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`)
  }
})

// =============================================
// REINITIALISATION MDP — Envoyer le lien
// =============================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email requis' })

    const user = await query('SELECT id, email FROM utilisateurs WHERE email = $1', [email])
    if (user.rows.length === 0) {
      // Pour des raisons de securite, ne pas reveler si l'email existe
      return res.json({ message: 'Si cet email existe, un lien a ete envoye.' })
    }

    const { token } = await twoFactorService.genererTokenReset(user.rows[0].id)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    // Envoyer l'email (simulation en dev)
    console.log(`[RESET MDP] Lien envoye a ${email}: ${resetUrl}`)

    // En prod : envoyer l'email avec le lien
    // await envoyerEmail(email, 'Reinitialisation Koleya', `Cliquez sur ce lien: ${resetUrl}`)

    res.json({ message: 'Si cet email existe, un lien a ete envoye.' })
  } catch (err) {
    console.error('Erreur forgot password:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// REINITIALISATION MDP — Confirmer avec SMS
// =============================================
router.post('/reset-password/confirm', async (req, res) => {
  try {
    const { token, nouveau_mdp, code_sms } = req.body
    if (!token || !nouveau_mdp) return res.status(400).json({ error: 'Token et nouveau mot de passe requis' })

    // Verifier le token de reinitialisation
    const verification = await twoFactorService.verifierTokenReset(token)
    if (!verification.succes) {
      return res.status(401).json({ error: verification.erreur })
    }

    // Si 2FA actif, verifier le code SMS
    const user = await query('SELECT two_factor_active, telephone FROM utilisateurs WHERE id = $1', [verification.userId])
    if (user.rows[0]?.two_factor_active && code_sms) {
      const verif2FA = await twoFactorService.verifierCode2FA(verification.userId, code_sms)
      if (!verif2FA.succes) {
        return res.status(401).json({ error: 'Code SMS incorrect' })
      }
    }

    // Reinitialiser le mot de passe
    await twoFactorService.reinitialiserMDP(verification.userId, nouveau_mdp)

    res.json({ message: 'Mot de passe reinitialise avec succes' })
  } catch (err) {
    console.error('Erreur reset password:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// HISTORIQUE DES CONNEXIONS
// =============================================
router.get('/login-history', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM login_history WHERE utilisateur_id = $1 ORDER BY cree_le DESC LIMIT 20',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
