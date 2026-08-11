const express = require('express')
const { query } = require('../config/database')
const { handler } = require('../lib/auth')

const router = express.Router()
router.use(handler)

// GET /api/ventes — Liste des ventes
router.get('/', async (req, res) => {
  try {
    const { statut, date_debut, date_fin, limit = 50 } = req.query
    let sql = `SELECT v.*, cl.nom AS client_nom
      FROM ventes v LEFT JOIN clients cl ON v.client_id = cl.id
      WHERE v.entreprise_id = $1 AND v.supprime_le IS NULL`
    const params = [req.entrepriseId]
    let ci = 2

    if (statut) { sql += ` AND v.statut = $${ci++}`; params.push(statut) }
    if (date_debut) { sql += ` AND v.date >= $${ci++}`; params.push(date_debut) }
    if (date_fin) { sql += ` AND v.date <= $${ci++}`; params.push(date_fin) }
    sql += ` ORDER BY v.cree_le DESC LIMIT $${ci++}`
    params.push(limit)

    const result = await query(sql, params)

    // Charger les lignes pour chaque vente
    const ventes = await Promise.all(result.rows.map(async (v) => {
      const lignes = await query(
        'SELECT vl.*, p.nom AS produit_nom FROM vente_lignes vl LEFT JOIN produits p ON vl.produit_id = p.id WHERE vl.vente_id = $1 ORDER BY vl.ordre',
        [v.id])
      return { ...v, items: lignes.rows }
    }))

    res.json(ventes)
  } catch (err) {
    console.error('Erreur GET ventes:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/ventes — Creer une vente
router.post('/', async (req, res) => {
  try {
    const { client_id, items, mode_paiement, remise, notes, date } = req.body
    if (!items || items.length === 0) return res.status(400).json({ error: 'Articles requis' })

    // Generer le numero
    const numResult = await query(
      'SELECT generer_numero($1, $2) AS numero', [req.entrepriseId, 'vente'])
    const numero = numResult.rows[0].numero

    const montant_total = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0)
    const remiseVal = remise || 0
    const montant_final = montant_total - remiseVal

    const vente = await query(
      `INSERT INTO ventes (entreprise_id, client_id, numero, date, mode_paiement, montant_total, remise, montant_final, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.entrepriseId, client_id || null, numero, date || new Date().toISOString().slice(0, 10),
       mode_paiement || 'especes', montant_total, remiseVal, montant_final, notes])

    // Inserer les lignes et mettre a jour le stock
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const itemTotal = (item.quantite * item.prix_unitaire) - (item.remise || 0)
      await query(
        `INSERT INTO vente_lignes (vente_id, produit_id, description, quantite, prix_unitaire, remise, total, ordre)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [vente.rows[0].id, item.produit_id || null, item.description, item.quantite, item.prix_unitaire, item.remise || 0, itemTotal, i])

      // Mettre a jour le stock si produit lie
      if (item.produit_id) {
        const prod = await query('SELECT stock FROM produits WHERE id = $1', [item.produit_id])
        if (prod.rows.length > 0) {
          const newStock = Math.max(0, prod.rows[0].stock - item.quantite)
          await query('UPDATE produits SET stock = $1, mis_a_jour_le = NOW() WHERE id = $2', [newStock, item.produit_id])
          await query(
            `INSERT INTO mouvements_stock (entreprise_id, produit_id, type_mouvement, quantite, quantite_avant, quantite_apres, motif, reference, utilisateur)
             VALUES ($1, $2, 'sortie', $3, $4, $5, 'Vente', $6, $7)`,
            [req.entrepriseId, item.produit_id, item.quantite, prod.rows[0].stock, newStock, numero, req.user.nom])
        }
      }
    }

    const lignes = await query('SELECT * FROM vente_lignes WHERE vente_id = $1', [vente.rows[0].id])
    res.status(201).json({ ...vente.rows[0], items: lignes.rows })
  } catch (err) {
    console.error('Erreur POST vente:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/ventes/:id/paiement — Enregistrer un paiement
router.put('/:id/paiement', async (req, res) => {
  try {
    const { montant, methode } = req.body
    const vente = await query('SELECT * FROM ventes WHERE id = $1 AND entreprise_id = $2', [req.params.id, req.entrepriseId])
    if (vente.rows.length === 0) return res.status(404).json({ error: 'Vente non trouvee' })

    const v = vente.rows[0]
    const nouveauPaye = parseFloat(v.montant_paye) + parseFloat(montant)
    const nouveauReste = Math.max(0, parseFloat(v.montant_final) - nouveauPaye)
    const nouveauStatut = nouveauReste <= 0 ? 'payee' : 'en_cours'

    await query(
      'UPDATE ventes SET montant_paye = $1, reste = $2, statut = $3, mode_paiement = COALESCE($4, mode_paiement), mis_a_jour_le = NOW() WHERE id = $5',
      [nouveauPaye, nouveauReste, nouveauStatut, methode, req.params.id])

    res.json({ message: 'Paiement enregistre', nouveauStatut, nouveauReste })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/ventes/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await query(
      `UPDATE ventes SET supprime_le = NOW(), supprime_par = $1 WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Vente non trouvee' })
    res.json({ message: 'Vente supprimee' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
