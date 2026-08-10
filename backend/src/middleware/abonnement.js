const { query } = require('../config/database')

// Plafonds applicables pendant l'essai gratuit (7 jours)
const QUOTAS_ESSAI = {
  factures: 10,
  clients: 5,
  produits: 3,
  utilisateurs: 1,
  notifications: 0, // SMS / WhatsApp / notifications bloqués pendant l'essai
}

// Tables et conditions supplémentaires pour le comptage par module
const MODULES = {
  factures: { table: 'factures', where: "AND type = 'facture'" },
  clients: { table: 'clients', where: '' },
  produits: { table: 'produits', where: '' },
  utilisateurs: { table: 'utilisateurs', where: 'AND actif = true' },
  notifications: { table: 'notifications', where: '' },
}

// Statut : 'actif' (payant) | 'essai' | 'expire'
function calculerStatut(e) {
  if (e.essai_active !== false && e.essai_fin) {
    if (new Date(e.essai_fin).getTime() < Date.now()) return 'expire'
    return 'essai'
  }
  return 'actif'
}

// Compter les lignes consommées d'un module depuis le début de la période de comptage
async function compterModule(type, entrepriseId, periodeComptageDebut) {
  const mod = MODULES[type]
  if (!mod) return 0
  const withSoftDelete = type !== 'utilisateurs'
  const sql = `SELECT COUNT(*) AS n FROM ${mod.table}
               WHERE entreprise_id = $1
               ${withSoftDelete ? 'AND supprime_le IS NULL' : ''}
               AND cree_le >= $2
               ${mod.where}`
  const r = await query(sql, [entrepriseId, periodeComptageDebut || '2026-01-01'])
  return parseInt(r.rows[0].n, 10)
}

// Compteurs de tous les modules (utilisé par GET /api/abonnement)
async function calculerCompteurs(ab, entrepriseId) {
  const compteurs = {}
  for (const type of Object.keys(MODULES)) {
    compteurs[type] = await compterModule(type, entrepriseId, ab.periode_comptage_debut)
  }
  return compteurs
}

// Charge l'abonnement et l'attache à req.abonnement
async function attacherAbonnement(req, res, next) {
  try {
    // Le super admin de la plateforme n'est pas soumis à l'essai ni aux quotas
    if (req.user && req.user.est_super_admin) {
      req.abonnement = {
        statut: 'actif',
        plan: 'business',
        essai_fin: null,
        essai_active: false,
        jours_restants: null,
        export_permis: true,
        compteurs: {},
      }
      return next()
    }

    const r = await query(
      `SELECT id, plan, actif, essai_fin, essai_active, periode_comptage_debut, dernier_achat_le
       FROM entreprises WHERE id = $1`,
      [req.entrepriseId]
    )
    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise introuvable' })
    }
    const e = r.rows[0]
    const statut = calculerStatut(e)
    const joursRestants =
      statut === 'essai'
        ? Math.max(0, Math.ceil((new Date(e.essai_fin) - Date.now()) / 86400000))
        : null

    req.abonnement = {
      statut, // 'actif' | 'essai' | 'expire'
      plan: e.plan,
      essai_fin: e.essai_fin,
      essai_active: e.essai_active,
      jours_restants: joursRestants,
      export_permis: statut !== 'expire',
      periode_comptage_debut: e.periode_comptage_debut,
      compteurs: {},
    }
    next()
  } catch (err) {
    next(err)
  }
}

// Bloque les écritures si l'abonnement est expiré (lecture seule + pas d'export)
function verifierEcriture(req, res, next) {
  if (!req.abonnement) return next()
  if (req.abonnement.statut === 'expire') {
    return res.status(403).json({
      error: 'Abonnement expiré. Passez à un plan payant pour continuer à créer et modifier.',
      code: 'ABONNEMENT_EXPIRE',
    })
  }
  next()
}

// Vérifie le quota d'un module pendant l'essai
function verifierQuota(type) {
  return async (req, res, next) => {
    try {
      const ab = req.abonnement
      if (!ab) return next()
      if (ab.statut !== 'essai') return next() // payant : aucun quota ; expiré : géré par verifierEcriture

      const plafond = QUOTAS_ESSAI[type]
      if (plafond === undefined) return next()

      const n = await compterModule(type, req.entrepriseId, ab.periode_comptage_debut)
      ab.compteurs[type] = n
      if (n >= plafond) {
        return res.status(403).json({
          error: `Quota d'essai atteint (${plafond} ${type}). Passez à un plan payant pour continuer.`,
          code: 'QUOTA_ATTEINT',
          quota: { type, actuel: n, plafond },
        })
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

module.exports = {
  QUOTAS_ESSAI,
  attacherAbonnement,
  verifierEcriture,
  verifierQuota,
  compterModule,
  calculerCompteurs,
  calculerStatut,
}