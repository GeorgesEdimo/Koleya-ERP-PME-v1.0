const { query } = require('../config/database')
const crypto = require('crypto')

// Generer un code 2FA a 6 chiffres
function genererCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// Envoyer un code 2FA par SMS
async function envoyerCode2FA(userId, telephone, canal = 'sms') {
  const code = genererCode()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  // Stocker le code en base
  await query(
    'INSERT INTO two_factor_codes (utilisateur_id, code, canal, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, code, canal, expiresAt]
  )

  // Envoyer le code (simulation en dev)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[2FA] Code ${canal.toUpperCase()} envoye a ${telephone}: ${code}`)
  } else {
    // En prod : appeler Africa's Talking ou autre provider
    // await envoyerSMS(telephone, `Votre code Koleya: ${code}`)
  }

  return { succes: true, expiresAt }
}

// Verifier un code 2FA
async function verifierCode2FA(userId, code) {
  const result = await query(
    `SELECT * FROM two_factor_codes
     WHERE utilisateur_id = $1 AND code = $2 AND utilise = false AND expires_at > NOW()
     ORDER BY cree_le DESC LIMIT 1`,
    [userId, code]
  )

  if (result.rows.length === 0) {
    return { succes: false, erreur: 'Code incorrect ou expire' }
  }

  // Marquer le code comme utilise
  await query('UPDATE two_factor_codes SET utilise = true WHERE id = $1', [result.rows[0].id])

  return { succes: true }
}

// Generer un token de reinitialisation MDP
async function genererTokenReset(userId) {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

  await query(
    'INSERT INTO password_resets (utilisateur_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  )

  return { token, expiresAt }
}

// Verifier un token de reinitialisation
async function verifierTokenReset(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const result = await query(
    `SELECT pr.*, u.email, u.id AS user_id
     FROM password_resets pr
     JOIN utilisateurs u ON pr.utilisateur_id = u.id
     WHERE pr.token_hash = $1 AND pr.utilise = false AND pr.expires_at > NOW()`,
    [tokenHash]
  )

  if (result.rows.length === 0) {
    return { succes: false, erreur: 'Token invalide ou expire' }
  }

  return { succes: true, userId: result.rows[0].user_id, email: result.rows[0].email }
}

// Reinitialiser le mot de passe
async function reinitialiserMDP(userId, nouveauMDP) {
  const bcrypt = require('bcryptjs')
  const hash = await bcrypt.hash(nouveauMDP, 12)

  await query('UPDATE utilisateurs SET mot_de_passe = $1 WHERE id = $2', [hash, userId])
  await query('UPDATE password_resets SET utilise = true WHERE utilisateur_id = $1 AND utilise = false', [userId])
  // Invalider tous les refresh tokens
  await query('DELETE FROM refresh_tokens WHERE utilisateur_id = $1', [userId])

  return { succes: true }
}

module.exports = {
  genererCode,
  envoyerCode2FA,
  verifierCode2FA,
  genererTokenReset,
  verifierTokenReset,
  reinitialiserMDP,
}
