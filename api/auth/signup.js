import query from '../lib/db.js'
import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken } from '../lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { email, mot_de_passe, nom, telephone, entreprise_nom } = req.body
    if (!email || !mot_de_passe || !nom) return res.status(400).json({ error: 'Champs requis manquants' })

    const existing = await query('SELECT id FROM utilisateurs WHERE email = $1', [email])
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Cet email est deja utilise' })

    const entreprise = await query(
      'INSERT INTO entreprises (nom, telephone, email) VALUES ($1, $2, $3) RETURNING *',
      [entreprise_nom || nom, telephone, email])

    const hash = await bcrypt.hash(mot_de_passe, 12)

    const user = await query(
      `INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role)
       VALUES ($1, $2, $3, $4, $5, 'proprietaire')
       RETURNING id, email, nom, telephone, role, entreprise_id, cree_le`,
      [entreprise.rows[0].id, email, hash, nom, telephone])

    const accessToken = generateAccessToken(user.rows[0])
    const refreshToken = generateRefreshToken(user.rows[0])

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await query('INSERT INTO refresh_tokens (utilisateur_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.rows[0].id, refreshToken, expiresAt])

    res.status(201).json({
      user: user.rows[0],
      entreprise: entreprise.rows[0],
      accessToken,
      refreshToken,
    })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
