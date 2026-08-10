const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture } = require('../middleware/abonnement')
const { validate, employeCreateSchema, employeUpdateSchema } = require('../middleware/validation')

const router = express.Router()
router.use(authenticate, attacherAbonnement)

// GET /api/employes (hors supprimés)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM employes WHERE entreprise_id = $1 AND supprime_le IS NULL ORDER BY nom`,
      [req.entrepriseId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/employes
router.post('/', verifierEcriture, validate(employeCreateSchema), async (req, res) => {
  try {
    const { nom, poste, salaire, date_embauche, telephone } = req.body
    const result = await query(
      `INSERT INTO employes (entreprise_id, nom, poste, salaire, date_embauche, telephone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.entrepriseId, nom, poste, salaire || 0, date_embauche, telephone]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST employe:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/employes/:id
router.put('/:id', verifierEcriture, validate(employeUpdateSchema), async (req, res) => {
  try {
    const { nom, poste, salaire, date_embauche, telephone, statut, conges_jours } = req.body
    const result = await query(
      `UPDATE employes SET nom = COALESCE($1, nom), poste = COALESCE($2, poste),
       salaire = COALESCE($3, salaire), date_embauche = COALESCE($4, date_embauche),
       telephone = COALESCE($5, telephone), statut = COALESCE($6, statut),
       conges_jours = COALESCE($7, conges_jours), mis_a_jour_le = NOW()
       WHERE id = $8 AND entreprise_id = $9 AND supprime_le IS NULL RETURNING *`,
      [nom, poste, salaire, date_embauche, telephone, statut, conges_jours, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/employes/:id — suppression logique
router.delete('/:id', verifierEcriture, async (req, res) => {
  try {
    const result = await query(
      `UPDATE employes SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' })
    }
    res.json({ message: 'Employé supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router