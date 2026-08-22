const express = require('express')
const { query, withTransaction } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture } = require('../middleware/abonnement')

const router = express.Router()

// Toutes les routes nécessitent l'auth + l'abonnement
router.use(authenticate, attacherAbonnement)

// =============================================
// Helpers de sécurité
// =============================================

// Validation stricte des UUID (évite les injections / erreurs de cast Postgres)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUUID(v) {
  return typeof v === 'string' && UUID_RE.test(v)
}

// Bornage d'un nombre (parse + clamp) — jamais NaN en base
function num(v, def = 0) {
  const n = parseFloat(v)
  if (!isFinite(n)) return def
  return Math.max(0, Math.min(n, 1e15))
}

function badId(res, champ = 'Identifiant invalide') {
  return res.status(400).json({ error: champ })
}

// Filtre toujours sur l'entreprise + (sauf suppression logique) hors supprimés
const RH_DOC_SOFT = " AND supprime_le IS NULL"

// =============================================
// STATS RH
// =============================================
router.get('/', async (req, res) => {
  try {
    const [[emp], [contrats], [conges]] = await Promise.all([
      query(
        `SELECT COUNT(*) AS n FROM employes WHERE entreprise_id = $1 AND supprime_le IS NULL`,
        [req.entrepriseId]
      ),
      query(
        `SELECT COUNT(*) AS n FROM employes WHERE entreprise_id = $1 AND supprime_le IS NULL AND statut = 'actif'`,
        [req.entrepriseId]
      ),
      query(
        `SELECT COUNT(*) AS n FROM rh_documents WHERE entreprise_id = $1${RH_DOC_SOFT} AND type_document = 'demande_conge' AND statut = 'en_attente'`,
        [req.entrepriseId]
      ),
    ])
    res.json({
      nb_employes: parseInt(emp.rows[0].n, 10),
      contrats_actifs: parseInt(contrats.rows[0].n, 10),
      conges_en_attente: parseInt(conges.rows[0].n, 10),
    })
  } catch (err) {
    console.error('Erreur GET rh stats:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// DOCUMENTS RH  (/documents)
// =============================================
router.get('/documents', async (req, res) => {
  try {
    const { employe_id, type_document } = req.query
    let sql = `SELECT * FROM rh_documents WHERE entreprise_id = $1${RH_DOC_SOFT}`
    const params = [req.entrepriseId]
    let i = 2
    if (employe_id) {
      if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
      sql += ` AND employe_id = $${i++}`
      params.push(employe_id)
    }
    if (type_document) {
      sql += ` AND type_document = $${i++}`
      params.push(type_document)
    }
    sql += ' ORDER BY cree_le DESC'
    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    console.error('Erreur GET documents:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/documents', verifierEcriture, async (req, res) => {
  try {
    const { employe_id, type_document, titre, variables, statut } = req.body
    if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
    if (!type_document) return res.status(400).json({ error: 'type_document requis' })
    const result = await query(
      `INSERT INTO rh_documents (entreprise_id, employe_id, type_document, titre, variables, statut, cree_par)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.entrepriseId,
        employe_id,
        type_document,
        titre || null,
        variables ? JSON.stringify(variables) : null,
        statut || 'brouillon',
        req.user.id,
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST document:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/documents/:id', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const { type_document, titre, variables, statut } = req.body
    const result = await query(
      `UPDATE rh_documents SET
         type_document = COALESCE($1, type_document),
         titre = COALESCE($2, titre),
         variables = COALESCE($3, variables),
         statut = COALESCE($4, statut),
         mis_a_jour_le = NOW()
       WHERE id = $5 AND entreprise_id = $6${RH_DOC_SOFT} RETURNING *`,
      [
        type_document || null,
        titre !== undefined ? titre : null,
        variables ? JSON.stringify(variables) : null,
        statut || null,
        req.params.id,
        req.entrepriseId,
      ]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document non trouvé' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/documents/:id', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const result = await query(
      `UPDATE rh_documents SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3${RH_DOC_SOFT} RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document non trouvé' })
    res.json({ message: 'Document supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Générer (statut = 'genere') — le PDF est généré côté frontend
router.post('/documents/:id/generer', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const result = await query(
      `UPDATE rh_documents SET statut = 'genere', mis_a_jour_le = NOW()
       WHERE id = $1 AND entreprise_id = $2${RH_DOC_SOFT} RETURNING *`,
      [req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document non trouvé' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// MISSIONS (/missions)
// =============================================
router.get('/missions', async (req, res) => {
  try {
    const { employe_id } = req.query
    let sql = `SELECT * FROM missions WHERE entreprise_id = $1`
    const params = [req.entrepriseId]
    let i = 2
    if (employe_id) {
      if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
      sql += ` AND employe_id = $${i++}`
      params.push(employe_id)
    }
    sql += ' ORDER BY cree_le DESC'
    res.json((await query(sql, params)).rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/missions', verifierEcriture, async (req, res) => {
  try {
    const { employe_id, objet, destination, date_debut, date_fin, motif, moyen_transport } = req.body
    if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
    const result = await query(
      `INSERT INTO missions (entreprise_id, employe_id, objet, destination, date_debut, date_fin, motif, moyen_transport, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'brouillon') RETURNING *`,
      [req.entrepriseId, employe_id, objet || null, destination || null, date_debut || null, date_fin || null, motif || null, moyen_transport || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST mission:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/missions/:id', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const { objet, destination, date_debut, date_fin, motif, moyen_transport, statut, approuver } = req.body
    // Approuver valide et renseigne approuve_par
    const result = await query(
      `UPDATE missions SET
         objet = COALESCE($1, objet),
         destination = COALESCE($2, destination),
         date_debut = COALESCE($3, date_debut),
         date_fin = COALESCE($4, date_fin),
         motif = COALESCE($5, motif),
         moyen_transport = COALESCE($6, moyen_transport),
         statut = COALESCE($7, statut),
         approuve_par = COALESCE($8, approuve_par),
         mis_a_jour_le = NOW()
       WHERE id = $9 AND entreprise_id = $10 RETURNING *`,
      [
        objet !== undefined ? objet : null,
        destination !== undefined ? destination : null,
        date_debut !== undefined ? date_debut : null,
        date_fin !== undefined ? date_fin : null,
        motif !== undefined ? motif : null,
        moyen_transport !== undefined ? moyen_transport : null,
        statut || null,
        approuver ? req.user.id : null,
        req.params.id,
        req.entrepriseId,
      ]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mission non trouvée' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// NOTES DE FRAIS (/notes-frais)
// =============================================
router.get('/notes-frais', async (req, res) => {
  try {
    const { employe_id } = req.query
    let sql = `SELECT * FROM notes_frais WHERE entreprise_id = $1`
    const params = [req.entrepriseId]
    let i = 2
    if (employe_id) {
      if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
      sql += ` AND employe_id = $${i++}`
      params.push(employe_id)
    }
    sql += ' ORDER BY cree_le DESC'
    const notes = (await query(sql, params)).rows
    const avecLignes = await Promise.all(
      notes.map(async (n) => {
        const lignes = await query('SELECT * FROM notes_frais_lignes WHERE note_frais_id = $1 ORDER BY date_frais', [n.id])
        return { ...n, lignes: lignes.rows }
      })
    )
    res.json(avecLignes)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/notes-frais', verifierEcriture, async (req, res) => {
  try {
    const { employe_id, date_soumission, statut, lignes } = req.body
    if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
    const note = await withTransaction(async (client) => {
      const n = await client.query(
        `INSERT INTO notes_frais (entreprise_id, employe_id, date_soumission, statut, total)
         VALUES ($1, $2, $3, $4, 0) RETURNING *`,
        [req.entrepriseId, employe_id, date_soumission || new Date().toISOString().slice(0, 10), statut || 'en_attente']
      )
      const noteId = n.rows[0].id
      const safeLignes = Array.isArray(lignes) ? lignes : []
      for (const l of safeLignes) {
        await client.query(
          `INSERT INTO notes_frais_lignes (note_frais_id, date_frais, categorie, description, montant)
           VALUES ($1, $2, $3, $4, $5)`,
          [noteId, l.date_frais || null, l.categorie || null, l.description || null, num(l.montant)]
        )
      }
      // Recalcul atomique du total
      const t = await client.query('SELECT COALESCE(SUM(montant),0) AS total FROM notes_frais_lignes WHERE note_frais_id = $1', [noteId])
      await client.query('UPDATE notes_frais SET total = $1 WHERE id = $2', [t.rows[0].total, noteId])
      return n.rows[0]
    })
    const lignesRes = await query('SELECT * FROM notes_frais_lignes WHERE note_frais_id = $1 ORDER BY date_frais', [note.id])
    res.status(201).json({ ...note, lignes: lignesRes.rows })
  } catch (err) {
    console.error('Erreur POST note frais:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/notes-frais/:id', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const { date_soumission, statut, lignes, approuver } = req.body
    const note = await withTransaction(async (client) => {
      const up = await client.query(
        `UPDATE notes_frais SET
           date_soumission = COALESCE($1, date_soumission),
           statut = COALESCE($2, statut),
           approuve_par = COALESCE($3, approuve_par),
           mis_a_jour_le = NOW()
         WHERE id = $4 AND entreprise_id = $5 RETURNING *`,
        [date_soumission !== undefined ? date_soumission : null, statut || null, approuver ? req.user.id : null, req.params.id, req.entrepriseId]
      )
      if (up.rows.length === 0) return null
      // Remplacer les lignes si fournies
      if (Array.isArray(lignes)) {
        await client.query('DELETE FROM notes_frais_lignes WHERE note_frais_id = $1', [req.params.id])
        for (const l of lignes) {
          await client.query(
            `INSERT INTO notes_frais_lignes (note_frais_id, date_frais, categorie, description, montant)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.params.id, l.date_frais || null, l.categorie || null, l.description || null, num(l.montant)]
          )
        }
        const t = await client.query('SELECT COALESCE(SUM(montant),0) AS total FROM notes_frais_lignes WHERE note_frais_id = $1', [req.params.id])
        await client.query('UPDATE notes_frais SET total = $1 WHERE id = $2', [t.rows[0].total, req.params.id])
      } else {
        const t = await client.query('SELECT COALESCE(SUM(montant),0) AS total FROM notes_frais_lignes WHERE note_frais_id = $1', [req.params.id])
        await client.query('UPDATE notes_frais SET total = $1 WHERE id = $2', [t.rows[0].total, req.params.id])
      }
      return up.rows[0]
    })
    if (!note) return res.status(404).json({ error: 'Note de frais non trouvée' })
    const lignesRes = await query('SELECT * FROM notes_frais_lignes WHERE note_frais_id = $1 ORDER BY date_frais', [note.id])
    res.json({ ...note, lignes: lignesRes.rows })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/notes-frais/:id', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const result = await query(
      `DELETE FROM notes_frais WHERE id = $1 AND entreprise_id = $2 RETURNING id`,
      [req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note de frais non trouvée' })
    res.json({ message: 'Note de frais supprimée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// VISITES MEDICALES (/visites)
// =============================================
router.get('/visites', async (req, res) => {
  try {
    const { employe_id } = req.query
    let sql = `SELECT * FROM visites_medicales WHERE entreprise_id = $1`
    const params = [req.entrepriseId]
    let i = 2
    if (employe_id) {
      if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
      sql += ` AND employe_id = $${i++}`
      params.push(employe_id)
    }
    sql += ' ORDER BY date_visite DESC NULLS LAST'
    res.json((await query(sql, params)).rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/visites', verifierEcriture, async (req, res) => {
  try {
    const { employe_id, date_visite, centre_medical, medecin, aptitude, restrictions, prochaine_visite } = req.body
    if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
    const result = await query(
      `INSERT INTO visites_medicales (entreprise_id, employe_id, date_visite, centre_medical, medecin, aptitude, restrictions, prochaine_visite)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.entrepriseId, employe_id, date_visite || null, centre_medical || null, medecin || null, aptitude || null, restrictions || null, prochaine_visite || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST visite:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/visites/:id', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const { date_visite, centre_medical, medecin, aptitude, restrictions, prochaine_visite } = req.body
    const result = await query(
      `UPDATE visites_medicales SET
         date_visite = COALESCE($1, date_visite),
         centre_medical = COALESCE($2, centre_medical),
         medecin = COALESCE($3, medecin),
         aptitude = COALESCE($4, aptitude),
         restrictions = COALESCE($5, restrictions),
         prochaine_visite = COALESCE($6, prochaine_visite),
         mis_a_jour_le = NOW()
       WHERE id = $7 AND entreprise_id = $8 RETURNING *`,
      [date_visite !== undefined ? date_visite : null, centre_medical !== undefined ? centre_medical : null, medecin !== undefined ? medecin : null, aptitude !== undefined ? aptitude : null, restrictions !== undefined ? restrictions : null, prochaine_visite !== undefined ? prochaine_visite : null, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visite non trouvée' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/visites/:id', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const result = await query(
      `DELETE FROM visites_medicales WHERE id = $1 AND entreprise_id = $2 RETURNING id`,
      [req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visite non trouvée' })
    res.json({ message: 'Visite supprimée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// MATERIEL (/materiel)
// =============================================
router.get('/materiel', async (req, res) => {
  try {
    const { employe_id } = req.query
    let sql = `SELECT * FROM materiel_employe WHERE entreprise_id = $1`
    const params = [req.entrepriseId]
    let i = 2
    if (employe_id) {
      if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
      sql += ` AND employe_id = $${i++}`
      params.push(employe_id)
    }
    sql += ' ORDER BY cree_le DESC'
    const materiels = (await query(sql, params)).rows
    const avecLignes = await Promise.all(
      materiels.map(async (m) => {
        const lignes = await query('SELECT * FROM materiel_employe_lignes WHERE materiel_id = $1 ORDER BY cree_le', [m.id])
        return { ...m, lignes: lignes.rows }
      })
    )
    res.json(avecLignes)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/materiel', verifierEcriture, async (req, res) => {
  try {
    const { employe_id, date_mise_a_disposition, statut, lignes } = req.body
    if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
    const mat = await withTransaction(async (client) => {
      const m = await client.query(
        `INSERT INTO materiel_employe (entreprise_id, employe_id, date_mise_a_disposition, statut)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.entrepriseId, employe_id, date_mise_a_disposition || new Date().toISOString().slice(0, 10), statut || 'actif']
      )
      const matId = m.rows[0].id
      const safeLignes = Array.isArray(lignes) ? lignes : []
      for (const l of safeLignes) {
        await client.query(
          `INSERT INTO materiel_employe_lignes (materiel_id, type_materiel, marque, numero_serie, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [matId, l.type_materiel || null, l.marque || null, l.numero_serie || null, l.description || null]
        )
      }
      return m.rows[0]
    })
    const lignesRes = await query('SELECT * FROM materiel_employe_lignes WHERE materiel_id = $1 ORDER BY cree_le', [mat.id])
    res.status(201).json({ ...mat, lignes: lignesRes.rows })
  } catch (err) {
    console.error('Erreur POST materiel:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/materiel/:id', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const { date_mise_a_disposition, statut, lignes } = req.body
    const mat = await withTransaction(async (client) => {
      const up = await client.query(
        `UPDATE materiel_employe SET
           date_mise_a_disposition = COALESCE($1, date_mise_a_disposition),
           statut = COALESCE($2, statut),
           mis_a_jour_le = NOW()
         WHERE id = $3 AND entreprise_id = $4 RETURNING *`,
        [date_mise_a_disposition !== undefined ? date_mise_a_disposition : null, statut || null, req.params.id, req.entrepriseId]
      )
      if (up.rows.length === 0) return null
      if (Array.isArray(lignes)) {
        await client.query('DELETE FROM materiel_employe_lignes WHERE materiel_id = $1', [req.params.id])
        for (const l of lignes) {
          await client.query(
            `INSERT INTO materiel_employe_lignes (materiel_id, type_materiel, marque, numero_serie, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.params.id, l.type_materiel || null, l.marque || null, l.numero_serie || null, l.description || null]
          )
        }
      }
      return up.rows[0]
    })
    if (!mat) return res.status(404).json({ error: 'Matériel non trouvé' })
    const lignesRes = await query('SELECT * FROM materiel_employe_lignes WHERE materiel_id = $1 ORDER BY cree_le', [mat.id])
    res.json({ ...mat, lignes: lignesRes.rows })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/materiel/:id', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const result = await query(
      `DELETE FROM materiel_employe WHERE id = $1 AND entreprise_id = $2 RETURNING id`,
      [req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Matériel non trouvé' })
    res.json({ message: 'Matériel supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// HISTORIQUE DE PAIE (/historique-paie)
// =============================================
router.get('/historique-paie', async (req, res) => {
  try {
    const { employe_id } = req.query
    let sql = `SELECT * FROM historique_paie WHERE entreprise_id = $1`
    const params = [req.entrepriseId]
    let i = 2
    if (employe_id) {
      if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
      sql += ` AND employe_id = $${i++}`
      params.push(employe_id)
    }
    sql += ' ORDER BY annee DESC, mois DESC'
    res.json((await query(sql, params)).rows)
  } catch (err) {
    console.error('Erreur GET historique paie:', err)
    // La table historique_paie peut ne pas exister dans certains environnements
    if (err.code === '42P01') return res.json([])
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
