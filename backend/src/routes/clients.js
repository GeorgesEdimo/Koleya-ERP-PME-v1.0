const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture, verifierQuota, compterModule } = require('../middleware/abonnement')
const { validate, clientCreateSchema, clientUpdateSchema } = require('../middleware/validation')

const router = express.Router()

// Toutes les routes nécessitent l'auth + le statut d'abonnement
router.use(authenticate, attacherAbonnement)

// GET /api/clients — Liste des clients (hors supprimés)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM clients WHERE entreprise_id = $1 AND supprime_le IS NULL ORDER BY cree_le DESC`,
      [req.entrepriseId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Erreur GET clients:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM clients WHERE id = $1 AND entreprise_id = $2 AND supprime_le IS NULL',
      [req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/clients — Créer un client (quota essai : 5)
router.post('/', verifierEcriture, verifierQuota('clients'), validate(clientCreateSchema), async (req, res) => {
  try {
    const { nom, telephone, email, adresse } = req.body
    const result = await query(
      `INSERT INTO clients (entreprise_id, nom, telephone, email, adresse)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.entrepriseId, nom, telephone, email, adresse]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST client:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/clients/:id
router.put('/:id', verifierEcriture, validate(clientUpdateSchema), async (req, res) => {
  try {
    const { nom, telephone, email, adresse } = req.body
    const result = await query(
      `UPDATE clients SET
        nom = COALESCE($1, nom),
        telephone = COALESCE($2, telephone),
        email = COALESCE($3, email),
        adresse = COALESCE($4, adresse),
        mis_a_jour_le = NOW()
       WHERE id = $5 AND entreprise_id = $6 AND supprime_le IS NULL RETURNING *`,
      [nom, telephone, email, adresse, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/clients/import — import en masse (ex : carnet de contacts CSV)
// Respecte le quota d'essai : n'importe que le nombre autorisé, ignore le reste.
router.post('/import', verifierEcriture, async (req, res) => {
  try {
    const clients = Array.isArray(req.body?.clients) ? req.body.clients : []
    if (clients.length === 0) return res.status(400).json({ error: 'Liste de clients vide' })
    const valides = clients.filter((c) => c && typeof c.nom === 'string' && c.nom.trim())

    // Plafond restant pendant l'essai
    let limite = Infinity
    if (req.abonnement?.statut === 'essai') {
      const { QUOTAS_ESSAI } = require('../middleware/abonnement')
      const actuel = await compterModule('clients', req.entrepriseId, req.abonnement.periode_comptage_debut)
      limite = Math.max(0, QUOTAS_ESSAI.clients - actuel)
    }
    const lot = valides.slice(0, limite)

    let importes = 0
    for (const c of lot) {
      await query(
        `INSERT INTO clients (entreprise_id, nom, telephone, email, adresse) VALUES ($1, $2, $3, $4, $5)`,
        [req.entrepriseId, c.nom.trim(), c.telephone || null, c.email || null, c.adresse || null]
      )
      importes++
    }
    res.status(201).json({ importes, ignores: valides.length - importes })
  } catch (err) {
    console.error('Erreur POST import clients:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/clients/:id — suppression logique (restaurable par le super admin)
router.delete('/:id', verifierEcriture, async (req, res) => {
  try {
    const result = await query(
      `UPDATE clients SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' })
    }
    res.json({ message: 'Client supprimé' })
  } catch (err) {
    console.error('Erreur DELETE client:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router