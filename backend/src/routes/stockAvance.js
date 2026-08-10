const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// GET /api/stock-avance/depots
router.get('/depots', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM depots WHERE entreprise_id = $1 ORDER BY principal DESC, nom',
      [req.entrepriseId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/stock-avance/depots
router.post('/depots', async (req, res) => {
  try {
    const { nom, adresse, responsable, principal } = req.body
    if (!nom) return res.status(400).json({ error: 'Le nom du depot est requis' })

    if (principal) {
      await query('UPDATE depots SET principal = false WHERE entreprise_id = $1', [req.entrepriseId])
    }

    const result = await query(
      `INSERT INTO depots (entreprise_id, nom, adresse, responsable, principal)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.entrepriseId, nom, adresse, responsable, principal || false]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/stock-avance/mouvements
router.get('/mouvements', async (req, res) => {
  try {
    const { produit_id, type_mouvement, date_debut, date_fin, limit = 50 } = req.query
    let sql = `
      SELECT m.*, p.nom AS produit_nom, p.reference, d.nom AS depot_nom
      FROM mouvements_stock m
      JOIN produits p ON m.produit_id = p.id
      LEFT JOIN depots d ON m.depot_id = d.id
      WHERE m.entreprise_id = $1
    `
    const params = [req.entrepriseId]
    let ci = 2

    if (produit_id) { sql += ` AND m.produit_id = $${ci++}`; params.push(produit_id) }
    if (type_mouvement) { sql += ` AND m.type_mouvement = $${ci++}`; params.push(type_mouvement) }
    if (date_debut) { sql += ` AND m.cree_le >= $${ci++}`; params.push(date_debut) }
    if (date_fin) { sql += ` AND m.cree_le <= $${ci++}`; params.push(date_fin) }
    sql += ` ORDER BY m.cree_le DESC LIMIT $${ci++}`
    params.push(limit)

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/stock-avance/mouvement — Enregistrer un mouvement
router.post('/mouvement', async (req, res) => {
  try {
    const { produit_id, depot_id, type_mouvement, quantite, motif, reference, prix_unitaire } = req.body
    if (!produit_id || !type_mouvement || !quantite) {
      return res.status(400).json({ error: 'Produit, type et quantite requis' })
    }

    // Recuperer le stock actuel
    const produit = await query('SELECT stock FROM produits WHERE id = $1 AND entreprise_id = $2', [produit_id, req.entrepriseId])
    if (produit.rows.length === 0) return res.status(404).json({ error: 'Produit non trouve' })

    const stockAvant = produit.rows[0].stock
    let stockApres = stockAvant

    if (type_mouvement === 'entree' || type_mouvement === 'inventaire') {
      stockApres = stockAvant + Math.abs(quantite)
    } else if (type_mouvement === 'sortie') {
      stockApres = Math.max(0, stockAvant - Math.abs(quantite))
    } else if (type_mouvement === 'ajustement') {
      stockApres = Math.max(0, stockAvant + quantite) // quantite peut etre negative
    }

    // Mettre a jour le stock
    await query('UPDATE produits SET stock = $1, mis_a_jour_le = NOW() WHERE id = $2', [stockApres, produit_id])

    // Enregistrer le mouvement
    const result = await query(
      `INSERT INTO mouvements_stock (entreprise_id, produit_id, depot_id, type_mouvement, quantite, quantite_avant, quantite_apres, prix_unitaire, motif, reference, utilisateur)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.entrepriseId, produit_id, depot_id, type_mouvement, quantite, stockAvant, stockApres, prix_unitaire, motif, reference, req.user.nom]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur mouvement stock:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/stock-avance/transfert — Transfert entre depots
router.post('/transfert', async (req, res) => {
  try {
    const { produit_id, depot_source, depot_destination, quantite, motif } = req.body
    if (!produit_id || !depot_source || !depot_destination || !quantite) {
      return res.status(400).json({ error: 'Tous les champs sont requis' })
    }
    if (depot_source === depot_destination) {
      return res.status(400).json({ error: 'Les depots source et destination sont identiques' })
    }

    // Mouvement de sortie du depot source
    await query(
      `INSERT INTO mouvements_stock (entreprise_id, produit_id, depot_id, depot_destination_id, type_mouvement, quantite, motif, utilisateur)
       VALUES ($1, $2, $3, $4, 'transfert', $5, $6, $7)`,
      [req.entrepriseId, produit_id, depot_source, depot_destination, quantite, motif || 'Transfert inter-depots', req.user.nom]
    )

    res.json({ message: 'Transfert enregistre' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
