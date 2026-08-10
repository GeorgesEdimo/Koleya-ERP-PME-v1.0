const express = require('express')
const { query } = require('../config/database')
const { authenticate, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate, requireSuperAdmin)

// Tables restaurables (soft delete) — liste blanche, jamais de saisie directe dans les requêtes
const RESTAURABLES = ['clients', 'factures', 'credits', 'produits', 'employes', 'depenses', 'notifications']

// Ressources consultables par entreprise (liste blanche)
const RESSOURCES = {
  clients: 'clients',
  factures: 'factures',
  credits: 'credits',
  produits: 'produits',
  employes: 'employes',
  depenses: 'depenses',
  notifications: 'notifications',
}

// GET /api/admin/entreprises — toutes les entreprises (vue plateforme)
router.get('/entreprises', async (req, res) => {
  try {
    const r = await query(
      `SELECT id, nom, plan, essai_fin, essai_active, actif, cree_le, dernier_achat_le
       FROM entreprises ORDER BY cree_le DESC`
    )
    res.json({ entreprises: r.rows, total: r.rows.length })
  } catch (err) {
    console.error('Erreur GET admin entreprises:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/admin/entreprises/:id — détail d'une entreprise
router.get('/entreprises/:id', async (req, res) => {
  try {
    const r = await query('SELECT * FROM entreprises WHERE id = $1', [req.params.id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Entreprise introuvable' })
    res.json({ entreprise: r.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/admin/entreprises/:id/:ressource — voir les données d'une entreprise
// ?supprimes=true → uniquement les éléments supprimés (pour la restauration)
router.get('/entreprises/:id/:ressource', async (req, res) => {
  const ressource = RESSOURCES[req.params.ressource]
  if (!ressource) return res.status(400).json({ error: 'Ressource inconnue' })
  try {
    const voirSupprimes = req.query.supprimes === 'true'
    const r = await query(
      `SELECT * FROM ${ressource}
       WHERE entreprise_id = $1 AND supprime_le ${voirSupprimes ? 'IS NOT NULL' : 'IS NULL'}
       ORDER BY cree_le DESC`,
      [req.params.id]
    )
    res.json({ [req.params.ressource]: r.rows, total: r.rows.length })
  } catch (err) {
    console.error('Erreur GET admin ressource:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/admin/restaurer/:table/:id — restaure un élément supprimé (soft delete)
router.post('/restaurer/:table/:id', async (req, res) => {
  const table = RESTAURABLES.includes(req.params.table) ? req.params.table : null
  if (!table) return res.status(400).json({ error: 'Table non restaurable' })
  try {
    const r = await query(
      `UPDATE ${table} SET supprime_le = NULL, supprime_par = NULL
       WHERE id = $1 AND supprime_le IS NOT NULL RETURNING id`,
      [req.params.id]
    )
    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Élément non trouvé ou non supprimé' })
    }
    res.json({ message: 'Élément restauré', id: req.params.id, table })
  } catch (err) {
    console.error('Erreur POST restaurer:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
