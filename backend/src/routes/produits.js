const express = require('express')
const { query, withTransaction } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture, verifierQuota } = require('../middleware/abonnement')
const {
  validate,
  produitCreateSchema,
  produitUpdateSchema,
  ajusterStockSchema,
} = require('../middleware/validation')

const router = express.Router()
router.use(authenticate, attacherAbonnement)

// GET /api/produits (hors supprimés)
router.get('/', async (req, res) => {
  try {
    const { categorie, alertes } = req.query
    let sql = 'SELECT * FROM produits WHERE entreprise_id = $1 AND supprime_le IS NULL'
    const params = [req.entrepriseId]
    if (categorie) { sql += ' AND categorie = $2'; params.push(categorie) }
    if (alertes === 'true') { sql += ' AND stock <= stock_min' }
    sql += ' ORDER BY nom'

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/produits (quota essai : 3)
router.post(
  '/',
  verifierEcriture,
  verifierQuota('produits'),
  validate(produitCreateSchema),
  async (req, res) => {
    try {
      const { nom, reference, categorie, stock, stock_min, prix_achat, prix_vente, fournisseur } = req.body
      const result = await query(
        `INSERT INTO produits (entreprise_id, nom, reference, categorie, stock, stock_min, prix_achat, prix_vente, fournisseur)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [req.entrepriseId, nom, reference, categorie, stock || 0, stock_min || 0, prix_achat || 0, prix_vente || 0, fournisseur]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      console.error('Erreur POST produit:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
)

// PUT /api/produits/:id
router.put('/:id', verifierEcriture, validate(produitUpdateSchema), async (req, res) => {
  try {
    const { nom, reference, categorie, stock, stock_min, prix_achat, prix_vente, fournisseur } = req.body
    const result = await query(
      `UPDATE produits SET nom = COALESCE($1, nom), reference = COALESCE($2, reference),
       categorie = COALESCE($3, categorie), stock = COALESCE($4, stock),
       stock_min = COALESCE($5, stock_min), prix_achat = COALESCE($6, prix_achat),
       prix_vente = COALESCE($7, prix_vente), fournisseur = COALESCE($8, fournisseur),
       mis_a_jour_le = NOW()
       WHERE id = $9 AND entreprise_id = $10 AND supprime_le IS NULL RETURNING *`,
      [nom, reference, categorie, stock, stock_min, prix_achat, prix_vente, fournisseur, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/produits/:id/stock — ajustement de stock (entrée/sortie), transaction atomique
router.put('/:id/stock', verifierEcriture, validate(ajusterStockSchema), async (req, res) => {
  try {
    const { quantite } = req.body
    const result = await withTransaction(async (client) => {
      const p = await client.query(
        'SELECT * FROM produits WHERE id = $1 AND entreprise_id = $2 AND supprime_le IS NULL',
        [req.params.id, req.entrepriseId]
      )
      if (p.rows.length === 0) {
        const err = new Error('Produit non trouvé')
        err.status = 404
        throw err
      }
      const nouveauStock = parseInt(p.rows[0].stock, 10) + quantite
      if (nouveauStock < 0) {
        const err = new Error('Stock insuffisant pour cette sortie')
        err.status = 400
        throw err
      }
      const u = await client.query(
        'UPDATE produits SET stock = $1, mis_a_jour_le = NOW() WHERE id = $2 RETURNING *',
        [nouveauStock, req.params.id]
      )
      return u.rows[0]
    })
    res.json(result)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/produits/:id — suppression logique
router.delete('/:id', verifierEcriture, async (req, res) => {
  try {
    const result = await query(
      `UPDATE produits SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }
    res.json({ message: 'Produit supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router