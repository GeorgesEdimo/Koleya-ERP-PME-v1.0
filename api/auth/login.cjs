const query = require('../lib/db.cjs')
const bcrypt = require('bcryptjs')
const { generateAccessToken, generateRefreshToken } = require('../lib/auth.cjs')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { email, mot_de_passe } = req.body
    if (!email || !mot_de_passe) return res.status(400).json({ error: 'Email et mot de passe requis' })

    const result = await query(
      `SELECT u.*, e.nom AS entreprise_nom, e.plan FROM utilisateurs u
       JOIN entreprises e ON u.entreprise_id = e.id
       WHERE u.email = $1 AND u.actif = true`, [email]
    )

    if (result.rows.length === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    const user = result.rows[0]
    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe)
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    await query('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1', [user.id])

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await query('INSERT INTO refresh_tokens (utilisateur_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt])

    res.json({
      user: { id: user.id, email: user.email, nom: user.nom, telephone: user.telephone, role: user.role, entreprise_id: user.entreprise_id },
      entreprise: { id: user.entreprise_id, nom: user.entreprise_nom, plan: user.plan },
      accessToken, refreshToken,
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
