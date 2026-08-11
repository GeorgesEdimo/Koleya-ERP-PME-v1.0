const express = require('express')
const bcrypt = require('bcryptjs')
const { query } = require('../config/database')
const { authenticate, requireSuperAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate, requireSuperAdmin)

// Tables avec soft delete (restaurables)
const RESTAURABLES = ['clients', 'factures', 'credits', 'produits', 'employes', 'depenses', 'notifications']

// Toutes les ressources consultables
const RESSOURCES = ['clients', 'factures', 'credits', 'produits', 'employes', 'depenses', 'notifications']

// =============================================
// ENTREPRISES — CRUD complet
// =============================================

// GET /api/admin/entreprises — Liste toutes les entreprises
router.get('/entreprises', async (req, res) => {
  try {
    const { search, plan, actif } = req.query
    let sql = `SELECT e.*,
      (SELECT COUNT(*) FROM utilisateurs u WHERE u.entreprise_id = e.id) AS nb_utilisateurs,
      (SELECT COUNT(*) FROM factures f WHERE f.entreprise_id = e.id AND f.type = 'facture' AND f.supprime_le IS NULL) AS nb_factures
       FROM entreprises e WHERE 1=1`
    const params = []
    let ci = 1

    if (search) { sql += ` AND LOWER(e.nom) LIKE $${ci++}`; params.push(`%${search.toLowerCase()}%`) }
    if (plan) { sql += ` AND e.plan = $${ci++}`; params.push(plan) }
    if (actif !== undefined) { sql += ` AND e.actif = $${ci++}`; params.push(actif === 'true') }

    sql += ' ORDER BY e.cree_le DESC'
    const r = await query(sql, params)
    res.json({ entreprises: r.rows, total: r.rows.length })
  } catch (err) {
    console.error('Erreur GET admin entreprises:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/admin/entreprises/:id — Detail d'une entreprise
router.get('/entreprises/:id', async (req, res) => {
  try {
    const r = await query(
      `SELECT e.*,
        (SELECT COUNT(*) FROM utilisateurs u WHERE u.entreprise_id = e.id) AS nb_utilisateurs,
        (SELECT COUNT(*) FROM factures f WHERE f.entreprise_id = e.id AND f.supprime_le IS NULL) AS nb_factures,
        (SELECT COUNT(*) FROM clients c WHERE c.entreprise_id = e.id AND c.supprime_le IS NULL) AS nb_clients,
        (SELECT COALESCE(SUM(total), 0) FROM factures f WHERE f.entreprise_id = e.id AND f.type = 'facture' AND f.supprime_le IS NULL) AS ca_total
       FROM entreprises e WHERE e.id = $1`,
      [req.params.id]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Entreprise introuvable' })
    res.json(r.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/admin/entreprises/:id — Modifier une entreprise
router.put('/entreprises/:id', async (req, res) => {
  try {
    const { nom, plan, actif, essai_active, essai_fin } = req.body
    const r = await query(
      `UPDATE entreprises SET
        nom = COALESCE($1, nom), plan = COALESCE($2, plan),
        actif = COALESCE($3, actif), essai_active = COALESCE($4, essai_active),
        essai_fin = COALESCE($5, essai_fin), mis_a_jour_le = NOW()
       WHERE id = $6 RETURNING *`,
      [nom, plan, actif, essai_active, essai_fin, req.params.id]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Entreprise introuvable' })
    res.json(r.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/admin/entreprises/:id — Supprimer une entreprise (hard delete)
router.delete('/entreprises/:id', async (req, res) => {
  try {
    const r = await query('DELETE FROM entreprises WHERE id = $1 RETURNING id, nom', [req.params.id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Entreprise introuvable' })
    res.json({ message: 'Entreprise supprimee', entreprise: r.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// UTILISATEURS — CRUD complet
// =============================================

// GET /api/admin/utilisateurs — Liste tous les utilisateurs
router.get('/utilisateurs', async (req, res) => {
  try {
    const { entreprise_id, role, search } = req.query
    let sql = `SELECT u.id, u.email, u.nom, u.telephone, u.role, u.est_super_admin,
      u.actif, u.derniere_connexion, u.cree_le, u.entreprise_id,
      e.nom AS entreprise_nom
       FROM utilisateurs u
       LEFT JOIN entreprises e ON u.entreprise_id = e.id
       WHERE 1=1`
    const params = []
    let ci = 1

    if (entreprise_id) { sql += ` AND u.entreprise_id = $${ci++}`; params.push(entreprise_id) }
    if (role) { sql += ` AND u.role = $${ci++}`; params.push(role) }
    if (search) { sql += ` AND (LOWER(u.nom) LIKE $${ci} OR LOWER(u.email) LIKE $${ci})`; params.push(`%${search.toLowerCase()}%`); ci++ }

    sql += ' ORDER BY u.cree_le DESC'
    const r = await query(sql, params)
    res.json({ utilisateurs: r.rows, total: r.rows.length })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/admin/utilisateurs — Creer un utilisateur
router.post('/utilisateurs', async (req, res) => {
  try {
    const { entreprise_id, email, mot_de_passe, nom, telephone, role } = req.body
    if (!entreprise_id || !email || !mot_de_passe || !nom) {
      return res.status(400).json({ error: 'Champs requis manquants' })
    }

    const existing = await query('SELECT id FROM utilisateurs WHERE email = $1', [email])
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email deja utilise' })

    const hash = await bcrypt.hash(mot_de_passe, 12)
    const r = await query(
      `INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, nom, telephone, role, entreprise_id, cree_le`,
      [entreprise_id, email, hash, nom, telephone, role || 'employe']
    )
    res.status(201).json(r.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/admin/utilisateurs/:id — Modifier un utilisateur
router.put('/utilisateurs/:id', async (req, res) => {
  try {
    const { nom, email, telephone, role, actif, mot_de_passe } = req.body
    let sql = `UPDATE utilisateurs SET
      nom = COALESCE($1, nom), email = COALESCE($2, email),
      telephone = COALESCE($3, telephone), role = COALESCE($4, role),
      actif = COALESCE($5, actif)`
    const params = [nom, email, telephone, role, actif]
    let ci = 6

    if (mot_de_passe) {
      const hash = await bcrypt.hash(mot_de_passe, 12)
      sql += `, mot_de_passe = $${ci++}`
      params.push(hash)
    }

    sql += ` WHERE id = $${ci} RETURNING id, email, nom, telephone, role, actif, entreprise_id`
    params.push(req.params.id)

    const r = await query(sql, params)
    if (r.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' })
    res.json(r.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/admin/utilisateurs/:id — Supprimer un utilisateur
router.delete('/utilisateurs/:id', async (req, res) => {
  try {
    const r = await query('DELETE FROM utilisateurs WHERE id = $1 RETURNING id, nom, email', [req.params.id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' })
    res.json({ message: 'Utilisateur supprime', utilisateur: r.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// RESSOURCES — CRUD complet sur tous les modules
// =============================================

// GET /api/admin/entreprises/:id/:ressource — Voir les donnees
router.get('/entreprises/:id/:ressource', async (req, res) => {
  if (!RESSOURCES.includes(req.params.ressource)) return res.status(400).json({ error: 'Ressource inconnue' })
  try {
    const voirSupprimes = req.query.supprimes === 'true'
    const r = await query(
      `SELECT * FROM ${req.params.ressource}
       WHERE entreprise_id = $1 AND supprime_le ${voirSupprimes ? 'IS NOT NULL' : 'IS NULL'}
       ORDER BY cree_le DESC`,
      [req.params.id]
    )
    res.json({ [req.params.ressource]: r.rows, total: r.rows.length })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/admin/entreprises/:id/:ressource — Creer dans une entreprise
router.post('/entreprises/:id/:ressource', async (req, res) => {
  if (!RESSOURCES.includes(req.params.ressource)) return res.status(400).json({ error: 'Ressource inconnue' })
  try {
    const data = { ...req.body, entreprise_id: req.params.id }
    const columns = Object.keys(data).filter(k => k !== 'id')
    const values = columns.map(k => data[k])
    const placeholders = columns.map((_, i) => `$${i + 1}`)

    const r = await query(
      `INSERT INTO ${req.params.ressource} (${columns.join(', ')})
       VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    )
    res.status(201).json(r.rows[0])
  } catch (err) {
    console.error('Erreur POST admin ressource:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/admin/entreprises/:id/:ressource/:itemId — Modifier
router.put('/entreprises/:id/:ressource/:itemId', async (req, res) => {
  if (!RESSOURCES.includes(req.params.ressource)) return res.status(400).json({ error: 'Ressource inconnue' })
  try {
    const data = req.body
    const columns = Object.keys(data).filter(k => k !== 'id' && k !== 'entreprise_id' && k !== 'cree_le')
    if (columns.length === 0) return res.status(400).json({ error: 'Aucune donnee a modifier' })

    const setClauses = columns.map((k, i) => `${k} = $${i + 1}`)
    const values = columns.map(k => data[k])
    values.push(req.params.itemId)

    const r = await query(
      `UPDATE ${req.params.ressource} SET ${setClauses.join(', ')}, mis_a_jour_le = NOW()
       WHERE id = $${columns.length + 1} AND entreprise_id = $${columns.length + 2} RETURNING *`,
      [...values, req.params.id]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Element introuvable' })
    res.json(r.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/admin/entreprises/:id/:ressource/:itemId — Soft delete
router.delete('/entreprises/:id/:ressource/:itemId', async (req, res) => {
  if (!RESSOURCES.includes(req.params.ressource)) return res.status(400).json({ error: 'Ressource inconnue' })
  try {
    const r = await query(
      `UPDATE ${req.params.ressource}
       SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL
       RETURNING id`,
      [req.user.id, req.params.itemId, req.params.id]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Element introuvable ou deja supprime' })
    res.json({ message: 'Element supprime (restaurable)' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// RESTAURATION — Restaurer des elements supprimes
// =============================================

// POST /api/admin/restaurer/:table/:id — Restaurer un element supprime
router.post('/restaurer/:table/:id', async (req, res) => {
  if (!RESTAURABLES.includes(req.params.table)) return res.status(400).json({ error: 'Table non restaurable' })
  try {
    const r = await query(
      `UPDATE ${req.params.table}
       SET supprime_le = NULL, supprime_par = NULL
       WHERE id = $1 AND supprime_le IS NOT NULL
       RETURNING id`,
      [req.params.id]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Element non trouve ou non supprime' })
    res.json({ message: 'Element restaure', id: req.params.id, table: req.params.table })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/admin/restaurer-tous/:table/:entrepriseId — Restaurer TOUS les elements supprimes d'une entreprise
router.post('/restaurer-tous/:table/:entrepriseId', async (req, res) => {
  if (!RESTAURABLES.includes(req.params.table)) return res.status(400).json({ error: 'Table non restaurable' })
  try {
    const r = await query(
      `UPDATE ${req.params.table}
       SET supprime_le = NULL, supprime_par = NULL
       WHERE entreprise_id = $1 AND supprime_le IS NOT NULL
       RETURNING id`,
      [req.params.entrepriseId]
    )
    res.json({ message: `${r.rowCount} element(s) restaure(s)`, count: r.rowCount })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// STATS GLOBALES — Vue plateforme
// =============================================

// GET /api/admin/stats — Statistiques globales de la plateforme
router.get('/stats', async (req, res) => {
  try {
    const [entreprises, users, factures, ca, active] = await Promise.all([
      query('SELECT COUNT(*) AS n FROM entreprises'),
      query('SELECT COUNT(*) AS n FROM utilisateurs'),
      query("SELECT COUNT(*) AS n FROM factures WHERE type = 'facture' AND supprime_le IS NULL"),
      query("SELECT COALESCE(SUM(total), 0) AS n FROM factures WHERE type = 'facture' AND supprime_le IS NULL"),
      query('SELECT COUNT(*) AS n FROM entreprises WHERE actif = true'),
    ])

    res.json({
      total_entreprises: parseInt(entreprises.rows[0].n),
      entreprises_actives: parseInt(active.rows[0].n),
      total_utilisateurs: parseInt(users.rows[0].n),
      total_factures: parseInt(factures.rows[0].n),
      ca_total: parseInt(ca.rows[0].n),
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
