const express = require('express')
const { query } = require('../config/database')
const { handler } = require('../middleware/auth')

const router = express.Router()
router.use(handler)

// GET /api/achats — Liste des achats
router.get('/', async (req, res) => {
  try {
    const { statut, date_debut, date_fin, limit = 50 } = req.query
    let sql = `SELECT * FROM achats WHERE entreprise_id = $1 AND supprime_le IS NULL`
    const params = [req.entrepriseId]
    let ci = 2

    if (statut) { sql += ` AND statut = $${ci++}`; params.push(statut) }
    if (date_debut) { sql += ` AND date >= $${ci++}`; params.push(date_debut) }
    if (date_fin) { sql += ` AND date <= $${ci++}`; params.push(date_fin) }
    sql += ` ORDER BY cree_le DESC LIMIT $${ci++}`
    params.push(limit)

    const result = await query(sql, params)

    const achats = await Promise.all(result.rows.map(async (a) => {
      const lignes = await query(
        'SELECT al.*, p.nom AS produit_nom FROM achat_lignes al LEFT JOIN produits p ON al.produit_id = p.id WHERE al.achat_id = $1 ORDER BY al.ordre',
        [a.id])
      return { ...a, items: lignes.rows }
    }))

    res.json(achats)
  } catch (err) {
    console.error('Erreur GET achats:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/achats — Creer un achat
router.post('/', async (req, res) => {
  try {
    const { fournisseur, items, mode_paiement, remise, notes, date } = req.body
    if (!items || items.length === 0) return res.status(400).json({ error: 'Articles requis' })

    const numResult = await query('SELECT generer_numero($1, $2) AS numero', [req.entrepriseId, 'achat'])
    const numero = numResult.rows[0].numero

    const montant_total = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0)
    const remiseVal = remise || 0
    const montant_final = montant_total - remiseVal

    const achat = await query(
      `INSERT INTO achats (entreprise_id, fournisseur, numero, date, mode_paiement, montant_total, remise, montant_final, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.entrepriseId, fournisseur, numero, date || new Date().toISOString().slice(0, 10),
       mode_paiement || 'especes', montant_total, remiseVal, montant_final, notes])

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const itemTotal = (item.quantite * item.prix_unitaire) - (item.remise || 0)
      await query(
        `INSERT INTO achat_lignes (achat_id, produit_id, description, quantite, prix_unitaire, remise, total, ordre)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [achat.rows[0].id, item.produit_id || null, item.description, item.quantite, item.prix_unitaire, item.remise || 0, itemTotal, i])

      // Mettre a jour le stock (entree)
      if (item.produit_id) {
        const prod = await query('SELECT stock FROM produits WHERE id = $1', [item.produit_id])
        if (prod.rows.length > 0) {
          const newStock = prod.rows[0].stock + item.quantite
          await query('UPDATE produits SET stock = $1, prix_achat = COALESCE($2, prix_achat), mis_a_jour_le = NOW() WHERE id = $3',
            [newStock, item.prix_unitaire, item.produit_id])
          await query(
            `INSERT INTO mouvements_stock (entreprise_id, produit_id, type_mouvement, quantite, quantite_avant, quantite_apres, motif, reference, utilisateur)
             VALUES ($1, $2, 'entree', $3, $4, $5, 'Achat', $6, $7)`,
            [req.entrepriseId, item.produit_id, item.quantite, prod.rows[0].stock, newStock, numero, req.user.nom])
        }
      }
    }

    const lignes = await query('SELECT * FROM achat_lignes WHERE achat_id = $1', [achat.rows[0].id])
    res.status(201).json({ ...achat.rows[0], items: lignes.rows })
  } catch (err) {
    console.error('Erreur POST achat:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/achats/:id/paiement
router.put('/:id/paiement', async (req, res) => {
  try {
    const { montant, methode } = req.body
    const achat = await query('SELECT * FROM achats WHERE id = $1 AND entreprise_id = $2', [req.params.id, req.entrepriseId])
    if (achat.rows.length === 0) return res.status(404).json({ error: 'Achat non trouve' })

    const a = achat.rows[0]
    const nouveauPaye = parseFloat(a.montant_paye) + parseFloat(montant)
    const nouveauReste = Math.max(0, parseFloat(a.montant_final) - nouveauPaye)
    const nouveauStatut = nouveauReste <= 0 ? 'payee' : 'en_cours'

    await query(
      'UPDATE achats SET montant_paye = $1, reste = $2, statut = $3, mode_paiement = COALESCE($4, mode_paiement), mis_a_jour_le = NOW() WHERE id = $5',
      [nouveauPaye, nouveauReste, nouveauStatut, methode, req.params.id])

    res.json({ message: 'Paiement enregistre', nouveauStatut, nouveauReste })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/achats/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await query(
      `UPDATE achats SET supprime_le = NOW(), supprime_par = $1 WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Achat non trouve' })
    res.json({ message: 'Achat supprime' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
