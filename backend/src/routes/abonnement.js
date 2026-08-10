const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const {
  attacherAbonnement,
  calculerCompteurs,
  QUOTAS_ESSAI,
} = require('../middleware/abonnement')
const { validate, payerSchema } = require('../middleware/validation')

const router = express.Router()
router.use(authenticate, attacherAbonnement)

// GET /api/abonnement — statut de l'abonnement + quotas + compteurs consommés
router.get('/', async (req, res) => {
  try {
    const compteurs = await calculerCompteurs(req.abonnement, req.entrepriseId)
    res.json({
      statut: req.abonnement.statut, // 'essai' | 'actif' | 'expire'
      plan: req.abonnement.plan,
      essai_fin: req.abonnement.essai_fin,
      essai_active: req.abonnement.essai_active,
      jours_restants: req.abonnement.jours_restants,
      export_permis: req.abonnement.export_permis,
      quotas: QUOTAS_ESSAI,
      compteurs,
      est_super_admin: !!req.user.est_super_admin,
    })
  } catch (err) {
    console.error('Erreur GET abonnement:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/abonnement/payer — paiement mock : active le plan choisi et remet les compteurs à zéro.
// Accessible même en statut 'expire' (c'est la sortie de secours).
router.post('/payer', validate(payerSchema), async (req, res) => {
  try {
    const { plan } = req.body
    const r = await query(
      `UPDATE entreprises
       SET plan = $1,
           essai_active = false,
           essai_fin = NULL,
           periode_comptage_debut = NOW(),
           dernier_achat_le = NOW()
       WHERE id = $2
       RETURNING id, plan, essai_active, dernier_achat_le`,
      [plan, req.entrepriseId]
    )
    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise introuvable' })
    }
    res.json({ message: 'Abonnement activé', entreprise: r.rows[0] })
  } catch (err) {
    console.error('Erreur POST payer:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
