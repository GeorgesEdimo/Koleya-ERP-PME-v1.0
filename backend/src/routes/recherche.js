const express = require('express')
const crypto = require('crypto')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement } = require('../middleware/abonnement')

const router = express.Router()

// Toutes les routes nécessitent l'auth + le statut d'abonnement.
// attacherAbonnement existe dans le projet : on le monte (sinon fallback authenticate seul).
router.use(authenticate, attacherAbonnement)

// =============================================
// HELPERS DE SECURITE
// =============================================

// Borne les paramètres de pagination pour éviter les abus / fuites de volume
function bornePagination(page, limit) {
  let p = parseInt(page, 10)
  if (!Number.isFinite(p) || p < 1) p = 1
  let l = parseInt(limit, 10)
  if (!Number.isFinite(l) || l < 1) l = 20
  if (l > 100) l = 100 // plafond strict exigé
  return { page: p, limit: l, offset: (p - 1) * l }
}

// Tronque le texte de recherche (empêche les ReDoS / payloads géants)
function normaliseQuery(q) {
  if (!q || typeof q !== 'string') return ''
  return q.trim().slice(0, 200)
}

// Validation stricte d'un UUID (jamais de concaténation SQL avec une valeur non validée)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUuid(v) {
  return typeof v === 'string' && UUID_RE.test(v)
}

const MODULES_AUTORISES = ['facture', 'devis', 'client', 'produit', 'employe', 'rh']
function estModuleAutorise(m) {
  return typeof m === 'string' && MODULES_AUTORISES.includes(m)
}

// Construit une clause ILIKE paramétrée pour la recherche texte (toujours via $N)
function clauseIlike(colonnes, paramIndex, params, terme) {
  const fragments = colonnes.map((c) => `${c} ILIKE $${paramIndex}`)
  params.push(`%${terme}%`)
  return `(${fragments.join(' OR ')})`
}

// =============================================
// GET /api/search — recherche globale multi-ressources (côté SQL)
// =============================================
router.get('/search', async (req, res) => {
  try {
    const { page, limit, offset } = bornePagination(req.query.page, req.query.limit)
    const q = normaliseQuery(req.query.q)
    const module = req.query.module
    const statut = typeof req.query.statut === 'string' && req.query.statut.trim() ? req.query.statut.trim().slice(0, 50) : ''

    // Sans module : agréger clients, factures, produits, employés
    if (!module || !estModuleAutorise(module)) {
      const resultats = []

      // 1. Clients
      {
        let sql = `SELECT id, nom, telephone, email, ville, pays FROM clients WHERE entreprise_id = $1 AND supprime_le IS NULL`
        const params = [req.entrepriseId]
        let pi = 2
        if (q) { sql += ` AND ${clauseIlike(['nom', 'telephone', 'email', 'ville', 'pays'], pi, params, q)}`; pi++ }
        sql += ` ORDER BY nom LIMIT $${pi++} OFFSET $${pi++}`
        params.push(limit, offset)
        const r = await query(sql, params)
        r.rows.forEach((row) => resultats.push({ type_resultat: 'client', ...row }))
      }

      // 2. Factures / Devis
      {
        let sql = `SELECT f.id, f.numero, f.type, f.statut, f.date, f.total_ttc, c.nom AS client_nom
                   FROM factures f JOIN clients c ON f.client_id = c.id
                   WHERE f.entreprise_id = $1 AND f.supprime_le IS NULL`
        const params = [req.entrepriseId]
        let pi = 2
        if (q) { sql += ` AND ${clauseIlike(['f.numero', 'c.nom', 'f.statut'], pi, params, q)}`; pi++ }
        if (statut) { sql += ` AND f.statut = $${pi++}`; params.push(statut) }
        sql += ` ORDER BY f.cree_le DESC LIMIT $${pi++} OFFSET $${pi++}`
        params.push(limit, offset)
        const r = await query(sql, params)
        r.rows.forEach((row) => resultats.push({ type_resultat: 'facture', ...row }))
      }

      // 3. Produits
      {
        let sql = `SELECT id, nom, reference, categorie, prix_vente FROM produits WHERE entreprise_id = $1 AND supprime_le IS NULL`
        const params = [req.entrepriseId]
        let pi = 2
        if (q) { sql += ` AND ${clauseIlike(['nom', 'reference', 'categorie'], pi, params, q)}`; pi++ }
        sql += ` ORDER BY nom LIMIT $${pi++} OFFSET $${pi++}`
        params.push(limit, offset)
        const r = await query(sql, params)
        r.rows.forEach((row) => resultats.push({ type_resultat: 'produit', ...row }))
      }

      // 4. Employés
      {
        let sql = `SELECT id, nom, prenom, poste, matricule FROM employes WHERE entreprise_id = $1 AND supprime_le IS NULL`
        const params = [req.entrepriseId]
        let pi = 2
        if (q) { sql += ` AND ${clauseIlike(['nom', 'prenom', 'poste', 'matricule'], pi, params, q)}`; pi++ }
        sql += ` ORDER BY nom LIMIT $${pi++} OFFSET $${pi++}`
        params.push(limit, offset)
        const r = await query(sql, params)
        r.rows.forEach((row) => resultats.push({ type_resultat: 'employe', ...row }))
      }

      return res.json({ resultats, total: resultats.length, page, limit, module: null })
    }

    // Recherche ciblée par module
    let sql = ''
    const params = [req.entrepriseId]
    let pi = 2

    if (module === 'facture' || module === 'devis') {
      sql = `SELECT f.id, f.numero, f.type, f.statut, f.date, f.total_ttc, c.nom AS client_nom
             FROM factures f JOIN clients c ON f.client_id = c.id
             WHERE f.entreprise_id = $1 AND f.supprime_le IS NULL`
      if (module === 'devis') { sql += ` AND f.type = 'devis'` }
      else { sql += ` AND f.type <> 'devis'` }
      if (q) { sql += ` AND ${clauseIlike(['f.numero', 'c.nom', 'f.statut'], pi, params, q)}`; pi++ }
      if (statut) { sql += ` AND f.statut = $${pi++}`; params.push(statut) }
      sql += ` ORDER BY f.cree_le DESC`
    } else if (module === 'client') {
      sql = `SELECT id, nom, telephone, email, ville, pays FROM clients WHERE entreprise_id = $1 AND supprime_le IS NULL`
      if (q) { sql += ` AND ${clauseIlike(['nom', 'telephone', 'email', 'ville', 'pays'], pi, params, q)}`; pi++ }
      if (statut) { sql += ` AND statut = $${pi++}`; params.push(statut) }
      sql += ` ORDER BY nom`
    } else if (module === 'produit') {
      sql = `SELECT id, nom, reference, categorie, prix_vente FROM produits WHERE entreprise_id = $1 AND supprime_le IS NULL`
      if (q) { sql += ` AND ${clauseIlike(['nom', 'reference', 'categorie'], pi, params, q)}`; pi++ }
      if (statut) { sql += ` AND statut = $${pi++}`; params.push(statut) }
      sql += ` ORDER BY nom`
    } else if (module === 'employe') {
      sql = `SELECT id, nom, prenom, poste, matricule FROM employes WHERE entreprise_id = $1 AND supprime_le IS NULL`
      if (q) { sql += ` AND ${clauseIlike(['nom', 'prenom', 'poste', 'matricule'], pi, params, q)}`; pi++ }
      if (statut) { sql += ` AND statut = $${pi++}`; params.push(statut) }
      sql += ` ORDER BY nom`
    } else if (module === 'rh') {
      sql = `SELECT id, type_document, titre, statut FROM rh_documents WHERE entreprise_id = $1 AND supprime_le IS NULL`
      if (q) { sql += ` AND ${clauseIlike(['type_document', 'titre', 'statut'], pi, params, q)}`; pi++ }
      if (statut) { sql += ` AND statut = $${pi++}`; params.push(statut) }
      sql += ` ORDER BY cree_le DESC`
    }

    // Pagination (appliquée au module ciblé)
    sql += ` LIMIT $${pi++} OFFSET $${pi++}`
    params.push(limit, offset)

    const result = await query(sql, params)

    // Compteur total filtré (même filtre, sans LIMIT/OFFSET)
    let countSql = sql.split(/\s+LIMIT\s+\$\d+\s+OFFSET\s+\$\d+\s*$/i)[0].replace(/\s+ORDER BY.*$/i, '')
    let countParams = params.slice(0, pi - 2)
    const countResult = await query(`SELECT COUNT(*) AS n FROM (${countSql}) AS sub`, countParams)
    const total = parseInt(countResult.rows[0].n, 10)

    return res.json({
      resultats: result.rows.map((row) => ({ type_resultat: module, ...row })),
      total,
      page,
      limit,
      module,
    })
  } catch (err) {
    console.error('Erreur GET search:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// GET /api/archives — liste des documents archivés
// =============================================
router.get('/archives', async (req, res) => {
  try {
    const { page, limit, offset } = bornePagination(req.query.page, req.query.limit)
    const module = typeof req.query.module === 'string' ? req.query.module.trim().slice(0, 20) : ''
    const typeDocument = typeof req.query.type_document === 'string' ? req.query.type_document.trim().slice(0, 50) : ''
    const q = normaliseQuery(req.query.q)

    let sql = `SELECT id, entreprise_id, module, document_id, type_document, numero, pdf_url, empreinte, cree_par, cree_le
               FROM documents_archives WHERE entreprise_id = $1`
    const params = [req.entrepriseId]
    let pi = 2
    if (module) { sql += ` AND module = $${pi++}`; params.push(module) }
    if (typeDocument) { sql += ` AND type_document = $${pi++}`; params.push(typeDocument) }
    if (q) { sql += ` AND ${clauseIlike(['numero', 'type_document'], pi, params, q)}`; pi++ }
    sql += ` ORDER BY cree_le DESC LIMIT $${pi++} OFFSET $${pi++}`
    params.push(limit, offset)

    const result = await query(sql, params)

    let countSql = `SELECT COUNT(*) AS n FROM documents_archives WHERE entreprise_id = $1`
    const countParams = [req.entrepriseId]
    let ci = 2
    if (module) { countSql += ` AND module = $${ci++}`; countParams.push(module) }
    if (typeDocument) { countSql += ` AND type_document = $${ci++}`; countParams.push(typeDocument) }
    if (q) { countSql += ` AND ${clauseIlike(['numero', 'type_document'], ci, countParams, q)}`; ci++ }
    const countResult = await query(countSql, countParams)
    const total = parseInt(countResult.rows[0].n, 10)

    return res.json({ archives: result.rows, total, page, limit })
  } catch (err) {
    console.error('Erreur GET archives:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// GET /api/historique — historique des changements de statut
// =============================================
router.get('/historique', async (req, res) => {
  try {
    const { page, limit, offset } = bornePagination(req.query.page, req.query.limit)
    const module = typeof req.query.module === 'string' ? req.query.module.trim().slice(0, 20) : ''
    const documentId = typeof req.query.document_id === 'string' ? req.query.document_id.trim() : ''

    if (documentId && !isUuid(documentId)) {
      return res.status(400).json({ error: 'document_id invalide' })
    }

    let sql = `SELECT id, module, document_id, action, statut_avant, statut_apres, utilisateur_id, details, date
               FROM document_historique WHERE entreprise_id = $1`
    const params = [req.entrepriseId]
    let pi = 2
    if (module) { sql += ` AND module = $${pi++}`; params.push(module) }
    if (documentId) { sql += ` AND document_id = $${pi++}`; params.push(documentId) }
    sql += ` ORDER BY date DESC LIMIT $${pi++} OFFSET $${pi++}`
    params.push(limit, offset)

    const result = await query(sql, params)

    let countSql = `SELECT COUNT(*) AS n FROM document_historique WHERE entreprise_id = $1`
    const countParams = [req.entrepriseId]
    let ci = 2
    if (module) { countSql += ` AND module = $${ci++}`; countParams.push(module) }
    if (documentId) { countSql += ` AND document_id = $${ci++}`; countParams.push(documentId) }
    const countResult = await query(countSql, countParams)
    const total = parseInt(countResult.rows[0].n, 10)

    return res.json({ evenements: result.rows, total, page, limit })
  } catch (err) {
    console.error('Erreur GET historique:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// POST /api/archives — inscrire un document aux archives (empreinte SHA256 serveur)
// =============================================
router.post('/archives', async (req, res) => {
  try {
    const { module, document_id, type_document, numero, pdf_url, variables } = req.body

    if (!estModuleAutorise(module)) {
      return res.status(400).json({ error: 'module invalide' })
    }
    if (!isUuid(document_id)) {
      return res.status(400).json({ error: 'document_id invalide (UUID requis)' })
    }

    const typeDoc = typeof type_document === 'string' ? type_document.slice(0, 50) : null
    const num = typeof numero === 'string' ? numero.slice(0, 50) : null
    const pdf = typeof pdf_url === 'string' ? pdf_url.slice(0, 1000) : null

    // Empreinte SHA256 calculée côté serveur UNIQUEMENT sur le contenu fourni.
    // On hache JSON.stringify(variables) s'il est présent, sinon le document_id+type.
    const contenuEmpreinte = variables !== undefined && variables !== null
      ? JSON.stringify(variables)
      : JSON.stringify({ document_id, type_document, numero, pdf_url })
    const empreinte = 'sha256:' + crypto.createHash('sha256').update(contenuEmpreinte).digest('hex')

    // variables doit être un JSONB valide (objet ou tableau) ou null
    let vars = null
    if (variables !== undefined && variables !== null) {
      try {
        vars = typeof variables === 'string' ? JSON.parse(variables) : variables
      } catch (e) {
        return res.status(400).json({ error: 'variables doit être un JSON valide' })
      }
    }

    const result = await query(
      `INSERT INTO documents_archives
        (entreprise_id, module, document_id, type_document, numero, pdf_url, variables, empreinte, cree_par)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, module, document_id, type_document, numero, empreinte, cree_le`,
      [req.entrepriseId, module, document_id, typeDoc, num, pdf, JSON.stringify(vars), empreinte, req.user.id]
    )
    return res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST archives:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// POST /api/historique — inscrire un événement de changement de statut
// =============================================
router.post('/historique', async (req, res) => {
  try {
    const { module, document_id, action, statut_avant, statut_apres, details } = req.body

    if (!estModuleAutorise(module)) {
      return res.status(400).json({ error: 'module invalide' })
    }
    if (!isUuid(document_id)) {
      return res.status(400).json({ error: 'document_id invalide (UUID requis)' })
    }
    if (!action || typeof action !== 'string' || !action.trim()) {
      return res.status(400).json({ error: 'action requise' })
    }

    const actionVal = action.trim().slice(0, 50)
    const avant = (statut_avant && typeof statut_avant === 'string') ? statut_avant.slice(0, 50) : ''
    const apres = (statut_apres && typeof statut_apres === 'string') ? statut_apres.slice(0, 50) : null
    const det = (details && typeof details === 'string') ? details.slice(0, 2000) : null

    const result = await query(
      `INSERT INTO document_historique
        (entreprise_id, module, document_id, action, statut_avant, statut_apres, utilisateur_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, module, document_id, action, statut_avant, statut_apres, utilisateur_id, details, date`,
      [req.entrepriseId, module, document_id, actionVal, avant, apres, req.user.id, det]
    )
    return res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST historique:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
