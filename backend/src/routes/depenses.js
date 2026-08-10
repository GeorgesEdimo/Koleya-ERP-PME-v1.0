const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture } = require('../middleware/abonnement')
const { validate, depenseCreateSchema } = require('../middleware/validation')

const router = express.Router()
router.use(authenticate, attacherAbonnement)

// GET /api/depenses (hors supprimés)
router.get('/', async (req, res) => {
  try {
    const { categorie, date_debut, date_fin } = req.query
    let sql = 'SELECT * FROM depenses WHERE entreprise_id = $1 AND supprime_le IS NULL'
    const params = [req.entrepriseId]
    let ci = 2

    if (categorie) { sql += ` AND categorie = $${ci++}`; params.push(categorie) }
    if (date_debut) { sql += ` AND date >= $${ci++}`; params.push(date_debut) }
    if (date_fin) { sql += ` AND date <= $${ci++}`; params.push(date_fin) }
    sql += ' ORDER BY date DESC'

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/depenses
router.post('/', verifierEcriture, validate(depenseCreateSchema), async (req, res) => {
  try {
    const { categorie, description, montant, date } = req.body
    const result = await query(
      `INSERT INTO depenses (entreprise_id, categorie, description, montant, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.entrepriseId, categorie, description, montant, date || new Date().toISOString().slice(0, 10)]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST depense:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/depenses/:id — modification
router.put('/:id', verifierEcriture, validate(depenseCreateSchema.partial()), async (req, res) => {
  try {
    const { categorie, description, montant, date } = req.body
    const result = await query(
      `UPDATE depenses
       SET categorie = COALESCE($2, categorie),
           description = COALESCE($3, description),
           montant = COALESCE($4, montant),
           date = COALESCE($5, date)
       WHERE id = $1 AND entreprise_id = $6 AND supprime_le IS NULL
       RETURNING *`,
      [req.params.id, categorie, description, montant, date, req.entrepriseId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dépense introuvable' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Erreur PUT depense:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/depenses/:id — suppression logique
router.delete('/:id', verifierEcriture, async (req, res) => {
  try {
    const result = await query(
      `UPDATE depenses SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dépense non trouvée' })
    }
    res.json({ message: 'Dépense supprimée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router