const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// GET /api/comptabilite/plan-comptable
router.get('/plan-comptable', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM comptes WHERE entreprise_id = $1 ORDER BY numero',
      [req.entrepriseId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/comptabilite/ecriture — Nouvelle ecriture comptable
router.post('/ecriture', async (req, res) => {
  try {
    const { journal, date, libelle, reference, lignes } = req.body
    if (!journal || !date || !libelle || !lignes || lignes.length < 2) {
      return res.status(400).json({ error: 'Journal, date, libelle et au moins 2 lignes requis' })
    }

    // Verifier que debit = credit (equilibre)
    const totalDebit = lignes.reduce((s, l) => s + (l.debit || 0), 0)
    const totalCredit = lignes.reduce((s, l) => s + (l.credit || 0), 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: `Ecriture desequilibree: debit ${totalDebit} != credit ${totalCredit}` })
    }

    // Generer le numero
    const numResult = await query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next FROM ecritures WHERE entreprise_id = $1 AND journal = $2`,
      [req.entrepriseId, journal]
    )
    const numero = numResult.rows[0].next

    // Creer l'ecriture
    const ecriture = await query(
      `INSERT INTO ecritures (entreprise_id, journal, numero, date, libelle, reference)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.entrepriseId, journal, numero, date, libelle, reference]
    )

    // Inserer les lignes
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i]
      await query(
        `INSERT INTO ecriture_lignes (ecriture_id, compte_id, debit, credit, ordre)
         VALUES ($1, $2, $3, $4, $5)`,
        [ecriture.rows[0].id, l.compte_id, l.debit || 0, l.credit || 0, i]
      )
    }

    res.status(201).json(ecriture.rows[0])
  } catch (err) {
    console.error('Erreur ecriture comptable:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/comptabilite/balance — Balance comptable
router.get('/balance', async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query
    let sql = `
      SELECT c.numero, c.intitule, c.type, c.classe,
        COALESCE(SUM(el.debit), 0) AS total_debit,
        COALESCE(SUM(el.credit), 0) AS total_credit,
        COALESCE(SUM(el.debit), 0) - COALESCE(SUM(el.credit), 0) AS solde
      FROM comptes c
      LEFT JOIN ecriture_lignes el ON el.compte_id = c.id
      LEFT JOIN ecritures e ON el.ecriture_id = e.id AND e.entreprise_id = $1
      WHERE c.entreprise_id = $1 AND c.actif = true
    `
    const params = [req.entrepriseId]
    let ci = 2

    if (date_debut) { sql += ` AND e.date >= $${ci++}`; params.push(date_debut) }
    if (date_fin) { sql += ` AND e.date <= $${ci++}`; params.push(date_fin) }

    sql += ' GROUP BY c.id, c.numero, c.intitule, c.type, c.classe ORDER BY c.numero'

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/comptabilite/grand-livre — Grand livre
router.get('/grand-livre', async (req, res) => {
  try {
    const { compte_id, date_debut, date_fin } = req.query
    let sql = `
      SELECT e.date, e.journal, e.numero AS ecriture_numero, e.libelle,
        el.debit, el.credit,
        c.numero AS compte_numero, c.intitule AS compte_intitule
      FROM ecriture_lignes el
      JOIN ecritures e ON el.ecriture_id = e.id
      JOIN comptes c ON el.compte_id = c.id
      WHERE e.entreprise_id = $1
    `
    const params = [req.entrepriseId]
    let ci = 2

    if (compte_id) { sql += ` AND el.compte_id = $${ci++}`; params.push(compte_id) }
    if (date_debut) { sql += ` AND e.date >= $${ci++}`; params.push(date_debut) }
    if (date_fin) { sql += ` AND e.date <= $${ci++}`; params.push(date_fin) }

    sql += ' ORDER BY e.date, e.journal, e.numero'

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/comptabilite/tva — Situation TVA
router.get('/tva', async (req, res) => {
  try {
    const { periode } = req.query // format: YYYY-MM
    const debut = periode ? `${periode}-01` : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
    const fin = periode
      ? new Date(new Date(periode + '-01').getFullYear(), new Date(periode + '-01').getMonth() + 1, 0).toISOString().slice(0, 10)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)

    // TVA collectee (sur ventes)
    const collectee = await query(`
      SELECT COALESCE(SUM(f.total * COALESCE(e.tva, 0) / (100 + COALESCE(e.tva, 19.25))), 0) AS tva_collectee
      FROM factures f
      JOIN entreprises e ON f.entreprise_id = e.id
      WHERE f.entreprise_id = $1 AND f.type = 'facture' AND f.date BETWEEN $2 AND $3
    `, [req.entrepriseId, debut, fin])

    // TVA deductible (sur achats/depenses)
    const deductible = await query(`
      SELECT COALESCE(SUM(d.montant * 19.25 / 119.25), 0) AS tva_deductible
      FROM depenses d
      WHERE d.entreprise_id = $1 AND d.date BETWEEN $2 AND $3
    `, [req.entrepriseId, debut, fin])

    const tvaCollectee = parseFloat(collectee.rows[0].tva_collectee)
    const tvaDeductible = parseFloat(deductible.rows[0].tva_deductible)

    res.json({
      periode: { debut, fin },
      tva_collectee: Math.round(tvaCollectee),
      tva_deductible: Math.round(tvaDeductible),
      tva_a_payer: Math.round(tvaCollectee - tvaDeductible),
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
