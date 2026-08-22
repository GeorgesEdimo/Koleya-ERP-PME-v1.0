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
    // Devis meta si type = devis
    let devisMeta = null
    if (result.rows[0].type === 'devis') {
      const dm = await query('SELECT * FROM devis_meta WHERE facture_id = $1', [req.params.id])
      devisMeta = dm.rows[0] || null
    }
    res.json({ ...result.rows[0], items: lignes.rows, devisMeta })
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
      const { client_id, type, date, echeance, items, notes, remise_globale, devise, template_style,
        mode_calcul, surface, taux, duree, nb_intervenants, mention, validite_jours } = req.body

      const facture = await withTransaction(async (client) => {
        // Générer le numéro (atomique via sequence_numeros)
        const numeroResult = await client.query(
          'SELECT generer_numero($1, $2) AS numero',
          [req.entrepriseId, type || 'facture']
        )
        const numero = numeroResult.rows[0].numero

        // Calculs totaux
        let totalHT = 0
        let totalTVA = 0
        let totalTTC = 0
        const lignesCalculees = items.map((item, i) => {
          const ht = item.quantite * item.prix_unitaire
          const remise = ht * ((item.remise_pct || 0) / 100)
          const htApresRemise = ht - remise
          const tva = htApresRemise * ((item.taux_tva || 0) / 100)
          const ttc = htApresRemise + tva
          totalHT += htApresRemise
          totalTVA += tva
          totalTTC += ttc
          return {
            ...item,
            montant_ht: htApresRemise,
            montant_ttc: ttc,
            ordre: i,
          }
        })

        // Remise globale sur le total HT
        if (remise_globale) {
          const remiseGlobaleMontant = totalHT * (remise_globale / 100)
          totalHT -= remiseGlobaleMontant
          totalTTC -= remiseGlobaleMontant
          totalTVA = totalTTC - totalHT
        }

        const f = await client.query(
          `INSERT INTO factures (entreprise_id, client_id, numero, type, statut, date, echeance,
            total_ht, total_ttc, total, paye, reste, notes, remise_globale, devise, template_style)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, 0, $9, $10, $11, $12, $13) RETURNING *`,
          [
            req.entrepriseId, client_id, numero, type || 'facture',
            type === 'devis' ? 'brouillon' : 'en_attente',
            date || new Date().toISOString().slice(0, 10),
            echeance || date || new Date().toISOString().slice(0, 10),
            totalHT, totalTTC, notes,
            remise_globale || 0, devise || 'XAF', template_style || 'classique-bleu',
          ]
        )

        // Insérer les lignes avec TVA/remise
        for (const ligne of lignesCalculees) {
          await client.query(
            `INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire,
              taux_tva, remise_pct, montant_ht, montant_ttc, total, ordre)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [f.rows[0].id, ligne.description, ligne.quantite, ligne.prix_unitaire,
              ligne.taux_tva || 0, ligne.remise_pct || 0, ligne.montant_ht, ligne.montant_ttc,
              ligne.montant_ht, ligne.ordre]
          )
        }

        // Si devis, insérer dans devis_meta
        if (type === 'devis' && (mode_calcul || surface || taux || duree || nb_intervenants || mention || validite_jours)) {
          await client.query(
            `INSERT INTO devis_meta (facture_id, type_devis, mode_calcul, surface, taux, duree,
              nb_intervenants, mention, validite_jours)
             VALUES ($1, 'standard', $2, $3, $4, $5, $6, $7, $8)`,
            [f.rows[0].id, mode_calcul || 'prix_unitaire', surface || null, taux || null,
              duree || null, nb_intervenants || null, mention || null, validite_jours || null]
          )
        }

        return f.rows[0]
      })

      // Récupérer la facture complète avec les lignes
      const lignes = await query(
        'SELECT * FROM facture_lignes WHERE facture_id = $1 ORDER BY ordre',
        [facture.id]
      )

      // Devis meta si applicable
      let devisMeta = null
      if (type === 'devis') {
        const dm = await query('SELECT * FROM devis_meta WHERE facture_id = $1', [facture.id])
        devisMeta = dm.rows[0] || null
      }

      res.status(201).json({ ...facture, items: lignes.rows, devisMeta })
    } catch (err) {
      console.error('Erreur POST facture:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
)

// PUT /api/factures/:id — Mettre à jour (statut / paiement partiel / remise / template)
router.put('/:id', verifierEcriture, validate(factureUpdateSchema), async (req, res) => {
  try {
    const { statut, paye, notes, remise_globale, template_style } = req.body

    // Récupérer la facture actuelle pour recalculer si remise change
    const current = await query(
      'SELECT * FROM factures WHERE id = $1 AND entreprise_id = $2 AND supprime_le IS NULL',
      [req.params.id, req.entrepriseId]
    )
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }

    const facture = current.rows[0]
    let newTotalHT = Number(facture.total_ht)
    let newTotalTTC = Number(facture.total_ttc)

    // Si remise_globale fournie et différente, recalculer
    if (remise_globale !== undefined && Number(remise_globale) !== Number(facture.remise_globale || 0)) {
      const lignes = await query('SELECT * FROM facture_lignes WHERE facture_id = $1', [req.params.id])
      const htTotal = lignes.rows.reduce((s, l) => s + Number(l.montant_ht), 0)
      const remiseMontant = htTotal * (Number(remise_globale) / 100)
      newTotalHT = htTotal - remiseMontant
      newTotalTTC = newTotalHT + lignes.rows.reduce((s, l) => s + (Number(l.montant_ttc) - Number(l.montant_ht)), 0)
    }

    const result = await query(
      `UPDATE factures SET
        statut = COALESCE($1, statut),
        paye = COALESCE($2, paye),
        reste = COALESCE($7, total) - COALESCE($2, paye),
        notes = COALESCE($3, notes),
        remise_globale = COALESCE($4, remise_globale),
        template_style = COALESCE($5, template_style),
        total_ht = COALESCE($6, total_ht),
        total_ttc = COALESCE($7, total_ttc),
        mis_a_jour_le = NOW()
       WHERE id = $8 AND entreprise_id = $9 AND supprime_le IS NULL RETURNING *`,
      [statut, paye, notes, remise_globale, template_style, newTotalHT, newTotalTTC, req.params.id, req.entrepriseId]
    )

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

// POST /api/factures/:id/convertir — Convertir un devis en facture
router.post('/:id/convertir', verifierEcriture, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM factures WHERE id = $1 AND entreprise_id = $2 AND supprime_le IS NULL AND type = 'devis'`,
      [req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Devis non trouvé' })
    }

    const devis = result.rows[0]
    const lignes = await query('SELECT * FROM facture_lignes WHERE facture_id = $1 ORDER BY ordre', [devis.id])

    const facture = await withTransaction(async (client) => {
      const numeroResult = await client.query(
        'SELECT generer_numero($1, $2) AS numero',
        [req.entrepriseId, 'facture']
      )
      const numero = numeroResult.rows[0].numero

      const f = await client.query(
        `INSERT INTO factures (entreprise_id, client_id, numero, type, statut, date, echeance,
          total_ht, total_ttc, total, paye, reste, notes, remise_globale, devise, template_style)
         VALUES ($1, $2, $3, 'facture', 'en_attente', $4, $5, $6, $7, $7, 0, $7, $8, $9, $10, $11) RETURNING *`,
        [
          req.entrepriseId, devis.client_id, numero,
          new Date().toISOString().slice(0, 10),
          devis.echeance,
          devis.total_ht, devis.total_ttc,
          devis.notes,
          devis.remise_globale || 0, devis.devise || 'XAF', devis.template_style || 'classique-bleu',
        ]
      )

      for (const ligne of lignes.rows) {
        await client.query(
          `INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire,
            taux_tva, remise_pct, montant_ht, montant_ttc, total, ordre)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [f.rows[0].id, ligne.description, ligne.quantite, ligne.prix_unitaire,
            ligne.taux_tva || 0, ligne.remise_pct || 0, ligne.montant_ht, ligne.montant_ttc,
            ligne.total, ligne.ordre]
        )
      }

      // Marquer le devis comme converti
      await client.query(
        `UPDATE factures SET statut = 'valide', mis_a_jour_le = NOW() WHERE id = $1`,
        [devis.id]
      )

      return f.rows[0]
    })

    const newLignes = await query('SELECT * FROM facture_lignes WHERE facture_id = $1 ORDER BY ordre', [facture.id])
    res.status(201).json({ ...facture, items: newLignes.rows })
  } catch (err) {
    console.error('Erreur convertir devis:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router