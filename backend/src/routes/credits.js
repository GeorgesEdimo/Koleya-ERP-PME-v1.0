const express = require('express')
const { query, withTransaction } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture } = require('../middleware/abonnement')
const { validate, creditCreateSchema, paiementSchema } = require('../middleware/validation')

const router = express.Router()

// Toutes les routes nécessitent l'auth + l'abonnement
router.use(authenticate, attacherAbonnement)

// GET /api/credits (hors supprimés)
router.get('/', async (req, res) => {
  try {
    const { statut } = req.query
    let sql = `
      SELECT cr.*, cl.nom AS client_nom, cl.telephone AS client_telephone
      FROM credits cr JOIN clients cl ON cr.client_id = cl.id
      WHERE cr.entreprise_id = $1 AND cr.supprime_le IS NULL
    `
    const params = [req.entrepriseId]
    if (statut) { sql += ` AND cr.statut = $2`; params.push(statut) }
    sql += ' ORDER BY cr.cree_le DESC'

    const result = await query(sql, params)

    // Récupérer les paiements
    const credits = await Promise.all(
      result.rows.map(async (c) => {
        const paiements = await query(
          'SELECT * FROM credit_paiements WHERE credit_id = $1 ORDER BY date DESC',
          [c.id]
        )
        return { ...c, paiements: paiements.rows }
      })
    )

    res.json(credits)
  } catch (err) {
    console.error('Erreur GET credits:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/credits
router.post('/', verifierEcriture, validate(creditCreateSchema), async (req, res) => {
  try {
    const { client_id, montant_total, echeance, description } = req.body
    const result = await query(
      `INSERT INTO credits (entreprise_id, client_id, montant_total, reste, description, echeance)
       VALUES ($1, $2, $3, $3, $4, $5) RETURNING *`,
      [req.entrepriseId, client_id, montant_total, description, echeance]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST credit:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/credits/:id/paiement — transaction atomique (paiement + mise à jour du crédit)
router.post('/:id/paiement', verifierEcriture, validate(paiementSchema), async (req, res) => {
  try {
    const { montant, methode } = req.body

    // Vérifier le crédit
    const credit = await query(
      'SELECT * FROM credits WHERE id = $1 AND entreprise_id = $2 AND supprime_le IS NULL',
      [req.params.id, req.entrepriseId]
    )
    if (credit.rows.length === 0) {
      return res.status(404).json({ error: 'Crédit non trouvé' })
    }

    const c = credit.rows[0]
    if (c.statut === 'paye') {
      return res.status(400).json({ error: 'Ce crédit est déjà payé' })
    }

    // Enregistrer le paiement et mettre à jour le crédit dans la même transaction
    const { nouveauStatut, nouveauReste } = await withTransaction(async (client) => {
      await client.query(
        'INSERT INTO credit_paiements (credit_id, montant, methode) VALUES ($1, $2, $3)',
        [c.id, montant, methode || 'especes']
      )

      const nouveauPaye = parseFloat(c.montant_paye) + parseFloat(montant)
      const reste = Math.max(0, parseFloat(c.montant_total) - nouveauPaye)
      const statut = reste <= 0 ? 'paye' : 'en_cours'

      await client.query(
        'UPDATE credits SET montant_paye = $1, reste = $2, statut = $3, mis_a_jour_le = NOW() WHERE id = $4',
        [nouveauPaye, reste, statut, c.id]
      )
      return { nouveauStatut: statut, nouveauReste: reste }
    })

    res.json({ message: 'Paiement enregistré', ...{ nouveauStatut, nouveauReste } })
  } catch (err) {
    console.error('Erreur POST paiement:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/credits/:id — suppression logique
router.delete('/:id', verifierEcriture, async (req, res) => {
  try {
    const result = await query(
      `UPDATE credits SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crédit non trouvé' })
    }
    res.json({ message: 'Crédit supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router