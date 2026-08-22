const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture } = require('../middleware/abonnement')
const { validate, employeCreateSchema, employeUpdateSchema } = require('../middleware/validation')

const router = express.Router()
router.use(authenticate, attacherAbonnement)

// GET /api/employes (hors supprimés)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM employes WHERE entreprise_id = $1 AND supprime_le IS NULL ORDER BY nom`,
      [req.entrepriseId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Colonnes profil étendu (migration 014)
const COLS_PROFIL = [
  'matricule', 'civilite', 'prenom', 'nom_usage', 'date_naissance', 'lieu_naissance',
  'nationalite', 'adresse', 'num_secu', 'situation_familiale', 'nb_enfants', 'iban',
  'bic', 'contact_urgence', 'lien_parente', 'tel_urgence', 'manager_n1', 'site_travail',
  'email_pro', 'telephone_pro',
]

// POST /api/employes
router.post('/', verifierEcriture, validate(employeCreateSchema), async (req, res) => {
  try {
    const { nom, poste, salaire, date_embauche, telephone } = req.body
    const profil = {}
    for (const c of COLS_PROFIL) if (req.body[c] !== undefined) profil[c] = req.body[c]

    const cols = ['entreprise_id', 'nom', 'poste', 'salaire', 'date_embauche', 'telephone', ...Object.keys(profil)]
    const vals = [req.entrepriseId, nom, poste, salaire || 0, date_embauche, telephone, ...Object.values(profil)]
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
    const result = await query(
      `INSERT INTO employes (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST employe:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/employes/:id
router.put('/:id', verifierEcriture, validate(employeUpdateSchema), async (req, res) => {
  try {
    const { nom, poste, salaire, date_embauche, telephone, statut, conges_jours } = req.body
    const profil = {}
    for (const c of COLS_PROFIL) if (req.body[c] !== undefined) profil[c] = req.body[c]

    // Construction dynamique des SET profil avec COALESCE (ne pas écraser si absent)
    let idx = 10
    const sets = []
    const params = [nom, poste, salaire, date_embauche, telephone, statut, conges_jours]
    for (const c of Object.keys(profil)) {
      sets.push(`${c} = COALESCE($${idx}, ${c})`)
      params.push(profil[c])
      idx++
    }
    const result = await query(
      `UPDATE employes SET nom = COALESCE($1, nom), poste = COALESCE($2, poste),
       salaire = COALESCE($3, salaire), date_embauche = COALESCE($4, date_embauche),
       telephone = COALESCE($5, telephone), statut = COALESCE($6, statut),
       conges_jours = COALESCE($7, conges_jours), mis_a_jour_le = NOW()
       ${sets.length ? ', ' + sets.join(', ') : ''}
       WHERE id = $${idx} AND entreprise_id = $${idx + 1} AND supprime_le IS NULL RETURNING *`,
      [...params, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/employes/:id — suppression logique
router.delete('/:id', verifierEcriture, async (req, res) => {
  try {
    const result = await query(
      `UPDATE employes SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' })
    }
    res.json({ message: 'Employé supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router