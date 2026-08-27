const express = require('express')
const { query, withTransaction } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture } = require('../middleware/abonnement')

const router = express.Router()

router.use(authenticate, attacherAbonnement)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUUID(v) {
  return typeof v === 'string' && UUID_RE.test(v)
}
function num(v, def = 0) {
  const n = parseFloat(v)
  return isFinite(n) ? Math.max(0, Math.min(n, 1e15)) : def
}
function badId(res, msg = 'Identifiant invalide') {
  return res.status(400).json({ error: msg })
}

// =============================================
// PAIE (/paie)
// =============================================
router.get('/paie', async (req, res) => {
  try {
    const { employe_id, annee, mois } = req.query
    let sql = `SELECT * FROM bulletins_paie WHERE entreprise_id = $1`
    const params = [req.entrepriseId]
    let i = 2
    if (employe_id) {
      if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
      sql += ` AND employe_id = $${i++}`
      params.push(employe_id)
    }
    if (annee) {
      sql += ` AND annee = $${i++}`
      params.push(parseInt(annee, 10))
    }
    if (mois) {
      sql += ` AND mois = $${i++}`
      params.push(parseInt(mois, 10))
    }
    sql += ' ORDER BY annee DESC, mois DESC'
    res.json((await query(sql, params)).rows)
  } catch (err) {
    console.error('Erreur GET bulletins paie:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Calcul et création de bulletin (Barème OHADA / Cameroun standard)
router.post('/paie/calculer', verifierEcriture, async (req, res) => {
  try {
    const { employe_id, mois, annee, salaire_brut, heures_sup, primes, indemnites, avance_acomptes, mode_paiement } = req.body
    if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
    const m = parseInt(mois, 10)
    const a = parseInt(annee, 10)
    const brut = num(salaire_brut)
    if (!m || !a || brut <= 0) return res.status(400).json({ error: 'Mois, année et salaire brut requis' })

    // Cotisations sociales & fiscales (estimation standard Cameroun / OHADA)
    const hs = num(heures_sup)
    const p = num(primes)
    const ind = num(indemnites)
    const totalBrut = brut + hs + p + ind

    // CNPS salariale (4.2% plafonnée, ici simple 4.2% du brut imposable)
    const cnps = Math.round(totalBrut * 0.042)
    // Abattement forfaitaire 30% pour frais professionnels, puis barème IRPP progressif simplifié
    const baseTaxable = Math.max(0, totalBrut - cnps)
    const irpp = baseTaxable > 166667 ? Math.round((baseTaxable - 166667) * 0.10) : 0
    const cac = Math.round(irpp * 0.10) // Centimes additionnels communaux (10% de l'IRPP)
    const avances = num(avance_acomptes)

    const salaire_net = Math.round(totalBrut - cnps - irpp - cac - avances)

    const result = await query(
      `INSERT INTO bulletins_paie (
         entreprise_id, employe_id, mois, annee, salaire_brut, heures_sup, primes,
         indemnites, cnps, irpp, cac, avances_acomptes, salaire_net, mode_paiement, statut
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'genere')
       ON CONFLICT (entreprise_id, employe_id, mois, annee)
       DO UPDATE SET
         salaire_brut = EXCLUDED.salaire_brut,
         heures_sup = EXCLUDED.heures_sup,
         primes = EXCLUDED.primes,
         indemnites = EXCLUDED.indemnites,
         cnps = EXCLUDED.cnps,
         irpp = EXCLUDED.irpp,
         cac = EXCLUDED.cac,
         avances_acomptes = EXCLUDED.avances_acomptes,
         salaire_net = EXCLUDED.salaire_net,
         mode_paiement = EXCLUDED.mode_paiement,
         mis_a_jour_le = NOW()
       RETURNING *`,
      [req.entrepriseId, employe_id, m, a, brut, hs, p, ind, cnps, irpp, cac, avances, salaire_net, mode_paiement || 'virement']
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST calculer paie:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// CONGÉS (/conges)
// =============================================
router.get('/conges', async (req, res) => {
  try {
    const { employe_id, statut } = req.query
    let sql = `SELECT c.*, e.nom AS employe_nom, e.prenom AS employe_prenom FROM demandes_conges c JOIN employes e ON c.employe_id = e.id WHERE c.entreprise_id = $1`
    const params = [req.entrepriseId]
    let i = 2
    if (employe_id) {
      if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
      sql += ` AND c.employe_id = $${i++}`
      params.push(employe_id)
    }
    if (statut) {
      sql += ` AND c.statut = $${i++}`
      params.push(statut)
    }
    sql += ' ORDER BY c.cree_le DESC'
    res.json((await query(sql, params)).rows)
  } catch (err) {
    console.error('Erreur GET conges:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/conges', verifierEcriture, async (req, res) => {
  try {
    const { employe_id, type_conge, date_debut, date_fin, nb_jours, motif } = req.body
    if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
    if (!date_debut || !date_fin || !nb_jours) return res.status(400).json({ error: 'Dates et nombre de jours requis' })

    const result = await query(
      `INSERT INTO demandes_conges (entreprise_id, employe_id, type_conge, date_debut, date_fin, nb_jours, motif, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'en_attente') RETURNING *`,
      [req.entrepriseId, employe_id, type_conge || 'annuel', date_debut, date_fin, num(nb_jours), motif || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST conge:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.put('/conges/:id/decider', verifierEcriture, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) return badId(res)
    const { statut, commentaire_rh } = req.body
    if (!['approuve', 'refuse', 'annule'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' })
    }

    const conge = await withTransaction(async (client) => {
      const d = await client.query(
        `UPDATE demandes_conges SET
           statut = $1,
           approuve_par = $2,
           date_decision = NOW(),
           commentaire_rh = COALESCE($3, commentaire_rh),
           mis_a_jour_le = NOW()
         WHERE id = $4 AND entreprise_id = $5 RETURNING *`,
        [statut, req.user.id, commentaire_rh || null, req.params.id, req.entrepriseId]
      )
      if (d.rows.length === 0) return null
      const row = d.rows[0]

      // Si approuvé, mettre à jour le solde congés de l'année en cours
      if (statut === 'approuve') {
        const annee = new Date(row.date_debut).getFullYear()
        await client.query(
          `INSERT INTO soldes_conges (entreprise_id, employe_id, annee, jours_acquis, jours_pris)
           VALUES ($1, $2, $3, 30, $4)
           ON CONFLICT (entreprise_id, employe_id, annee)
           DO UPDATE SET jours_pris = soldes_conges.jours_pris + $4, mis_a_jour_le = NOW()`,
          [req.entrepriseId, row.employe_id, annee, row.nb_jours]
        )
      }
      return row
    })

    if (!conge) return res.status(404).json({ error: 'Demande de congé non trouvée' })
    res.json(conge)
  } catch (err) {
    console.error('Erreur decider conge:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Soldes de congés d'un employé
router.get('/conges/soldes/:employe_id', async (req, res) => {
  try {
    if (!isUUID(req.params.employe_id)) return badId(res)
    const annee = req.query.annee ? parseInt(req.query.annee, 10) : new Date().getFullYear()
    const result = await query(
      `SELECT * FROM soldes_conges WHERE entreprise_id = $1 AND employe_id = $2 AND annee = $3`,
      [req.entrepriseId, req.params.employe_id, annee]
    )
    if (result.rows.length === 0) {
      // Solde par défaut 30 acquis, 0 pris
      return res.json({ employe_id: req.params.employe_id, annee, jours_acquis: 30, jours_pris: 0, jours_reportes: 0 })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// =============================================
// ÉVALUATIONS (/evaluations)
// =============================================
router.get('/evaluations', async (req, res) => {
  try {
    const { employe_id, annee } = req.query
    let sql = `SELECT ev.*, e.nom AS employe_nom, e.prenom AS employe_prenom FROM evaluations_annuelles ev JOIN employes e ON ev.employe_id = e.id WHERE ev.entreprise_id = $1`
    const params = [req.entrepriseId]
    let i = 2
    if (employe_id) {
      if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
      sql += ` AND ev.employe_id = $${i++}`
      params.push(employe_id)
    }
    if (annee) {
      sql += ` AND ev.annee = $${i++}`
      params.push(parseInt(annee, 10))
    }
    sql += ' ORDER BY ev.annee DESC'
    res.json((await query(sql, params)).rows)
  } catch (err) {
    console.error('Erreur GET evaluations:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/evaluations', verifierEcriture, async (req, res) => {
  try {
    const { employe_id, annee, date_entretien, note_globale, note_technique, note_relationnelle, note_objectifs, points_forts, axes_amelioration, objectifs_annee_suivante, statut } = req.body
    if (!isUUID(employe_id)) return badId(res, 'employe_id invalide')
    const a = annee ? parseInt(annee, 10) : new Date().getFullYear()

    const result = await query(
      `INSERT INTO evaluations_annuelles (
         entreprise_id, employe_id, annee, evaluateur_id, date_entretien, note_globale,
         note_technique, note_relationnelle, note_objectifs, points_forts, axes_amelioration,
         objectifs_annee_suivante, statut
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (entreprise_id, employe_id, annee)
       DO UPDATE SET
         evaluateur_id = EXCLUDED.evaluateur_id,
         date_entretien = EXCLUDED.date_entretien,
         note_globale = EXCLUDED.note_globale,
         note_technique = EXCLUDED.note_technique,
         note_relationnelle = EXCLUDED.note_relationnelle,
         note_objectifs = EXCLUDED.note_objectifs,
         points_forts = EXCLUDED.points_forts,
         axes_amelioration = EXCLUDED.axes_amelioration,
         objectifs_annee_suivante = EXCLUDED.objectifs_annee_suivante,
         statut = EXCLUDED.statut,
         mis_a_jour_le = NOW()
       RETURNING *`,
      [
        req.entrepriseId, employe_id, a, req.user.id, date_entretien || null,
        num(note_globale), num(note_technique), num(note_relationnelle), num(note_objectifs),
        points_forts || null, axes_amelioration || null, objectifs_annee_suivante || null, statut || 'planifie'
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST evaluation:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
