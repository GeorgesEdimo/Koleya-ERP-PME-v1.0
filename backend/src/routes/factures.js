const express = require('express')
const { query, withTransaction } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture, verifierQuota } = require('../middleware/abonnement')
const { validate, factureCreateSchema, factureUpdateSchema } = require('../middleware/validation')

const router = express.Router()

// Toutes les routes nécessitent l'auth + l'abonnement
router.use(authenticate, attacherAbonnement)

// GET /api/factures — Liste des factures/devis (hors supprimés)
router.get('/', async (req, res) => {
  try {
    const { type, statut, page = 1, limit = 50 } = req.query
    let sql = `
      SELECT f.*, c.nom AS client_nom, c.telephone AS client_telephone
      FROM factures f
      JOIN clients c ON f.client_id = c.id
      WHERE f.entreprise_id = $1 AND f.supprime_le IS NULL
    `
    const params = [req.entrepriseId]
    let paramIndex = 2

    if (type) {
      sql += ` AND f.type = $${paramIndex++}`
      params.push(type)
    }
    if (statut) {
      sql += ` AND f.statut = $${paramIndex++}`
      params.push(statut)
    }

    sql += ` ORDER BY f.cree_le DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    params.push(parseInt(limit, 10), (parseInt(page, 10) - 1) * parseInt(limit, 10))

    const result = await query(sql, params)

    // Récupérer les lignes pour chaque facture
    const factures = await Promise.all(
      result.rows.map(async (f) => {
        const lignes = await query(
          'SELECT * FROM facture_lignes WHERE facture_id = $1 ORDER BY ordre',
          [f.id]
        )
        return { ...f, items: lignes.rows }
      })
    )

    // Compteur total (hors supprimés)
    let countSql = 'SELECT COUNT(*) FROM factures WHERE entreprise_id = $1 AND supprime_le IS NULL'
    const countParams = [req.entrepriseId]
    let ci = 2
    if (type) { countSql += ` AND type = $${ci++}`; countParams.push(type) }
    if (statut) { countSql += ` AND statut = $${ci++}`; countParams.push(statut) }
    const countResult = await query(countSql, countParams)

    res.json({
      factures,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    })
  } catch (err) {
    console.error('Erreur GET factures:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/factures/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT f.*, c.nom AS client_nom, c.telephone AS client_telephone
       FROM factures f JOIN clients c ON f.client_id = c.id
       WHERE f.id = $1 AND f.entreprise_id = $2 AND f.supprime_le IS NULL`,
      [req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }
    const lignes = await query(
      'SELECT * FROM facture_lignes WHERE facture_id = $1 ORDER BY ordre',
      [req.params.id]
    )
    res.json({ ...result.rows[0], items: lignes.rows })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/factures — Créer une facture/devis (quota essai : 10) — transaction atomique
router.post(
  '/',
  verifierEcriture,
  verifierQuota('factures'),
  validate(factureCreateSchema),
  async (req, res) => {
    try {
      const { client_id, type, date, echeance, items, notes } = req.body
      const total = items.reduce((sum, item) => sum + item.quantite * item.prix_unitaire, 0)

      const facture = await withTransaction(async (client) => {
        // Générer le numéro (atomique via sequence_numeros)
        const numeroResult = await client.query(
          'SELECT generer_numero($1, $2) AS numero',
          [req.entrepriseId, type || 'facture']
        )
        const numero = numeroResult.rows[0].numero

        const f = await client.query(
          `INSERT INTO factures (entreprise_id, client_id, numero, type, statut, date, echeance, total, paye, reste, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $8, $9) RETURNING *`,
          [
            req.entrepriseId, client_id, numero, type || 'facture',
            type === 'devis' ? 'brouillon' : 'en_attente',
            date || new Date().toISOString().slice(0, 10),
            echeance || date || new Date().toISOString().slice(0, 10),
            total, notes,
          ]
        )

        // Insérer les lignes
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const ligneTotal = item.quantite * item.prix_unitaire
          await client.query(
            `INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, total, ordre)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [f.rows[0].id, item.description, item.quantite, item.prix_unitaire, ligneTotal, i]
          )
        }
        return f.rows[0]
      })

      // Récupérer la facture complète avec les lignes
      const lignes = await query(
        'SELECT * FROM facture_lignes WHERE facture_id = $1 ORDER BY ordre',
        [facture.id]
      )

      res.status(201).json({ ...facture, items: lignes.rows })
    } catch (err) {
      console.error('Erreur POST facture:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
)

// PUT /api/factures/:id — Mettre à jour (statut / paiement partiel)
router.put('/:id', verifierEcriture, validate(factureUpdateSchema), async (req, res) => {
  try {
    const { statut, paye, notes } = req.body
    const result = await query(
      `UPDATE factures SET
        statut = COALESCE($1, statut),
        paye = COALESCE($2, paye),
        reste = total - COALESCE($2, paye),
        notes = COALESCE($3, notes),
        mis_a_jour_le = NOW()
       WHERE id = $4 AND entreprise_id = $5 AND supprime_le IS NULL RETURNING *`,
      [statut, paye, notes, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/factures/:id — suppression logique (restaurable par le super admin)
router.delete('/:id', verifierEcriture, async (req, res) => {
  try {
    const result = await query(
      `UPDATE factures SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }
    res.json({ message: 'Facture supprimée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router