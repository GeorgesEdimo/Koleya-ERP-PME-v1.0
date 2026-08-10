const express = require('express')
const { query } = require('../config/database')
const { authenticate, requireRole } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture, verifierQuota } = require('../middleware/abonnement')
const notifService = require('../services/notificationService')

const router = express.Router()
// Les notifications (SMS/WhatsApp) sont BLOQUÉES pendant l'essai (quota 0)
router.use(authenticate, attacherAbonnement)

// GET /api/notifications — Historique (hors supprimés)
router.get('/', async (req, res) => {
  try {
    const { type_source, statut, limit = 50, offset = 0 } = req.query
    let sql = 'SELECT * FROM notifications WHERE entreprise_id = $1 AND supprime_le IS NULL'
    const params = [req.entrepriseId]
    let ci = 2

    if (type_source) { sql += ` AND type_source = $${ci++}`; params.push(type_source) }
    if (statut) { sql += ` AND statut = $${ci++}`; params.push(statut) }
    sql += ` ORDER BY cree_le DESC LIMIT $${ci++} OFFSET $${ci++}`
    params.push(limit, offset)

    const result = await query(sql, params)

    // Compteur
    let countSql = 'SELECT COUNT(*) FROM notifications WHERE entreprise_id = $1 AND supprime_le IS NULL'
    const countParams = [req.entrepriseId]
    let cci = 2
    if (type_source) { countSql += ` AND type_source = $${cci++}`; countParams.push(type_source) }
    if (statut) { countSql += ` AND statut = $${cci++}`; countParams.push(statut) }
    const count = await query(countSql, countParams)

    // Stats rapides
    const stats = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE statut = 'envoye') AS envoyees,
        COUNT(*) FILTER (WHERE statut = 'echec') AS echecs,
        COUNT(*) FILTER (WHERE statut = 'en_attente') AS en_attente,
        COUNT(*) FILTER (WHERE DATE(cree_le) = CURRENT_DATE) AS aujourd_hui
      FROM notifications WHERE entreprise_id = $1 AND supprime_le IS NULL
    `, [req.entrepriseId])

    res.json({
      notifications: result.rows,
      total: parseInt(count.rows[0].count),
      stats: stats.rows[0],
    })
  } catch (err) {
    console.error('Erreur GET notifications:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/notifications/envoyer — Envoi manuel (bloqué pendant l'essai)
router.post(
  '/envoyer',
  verifierEcriture,
  verifierQuota('notifications'),
  async (req, res) => {
    try {
      const { canal, destinataire, destinataire_nom, sujet, message } = req.body
      if (!canal || !destinataire || !message) {
        return res.status(400).json({ error: 'Canal, destinataire et message requis' })
      }

      const result = await notifService.envoyerNotification({
        entrepriseId: req.entrepriseId,
        canal,
        destinataire,
        destinataireNom: destinataire_nom,
        sujet,
        message,
        typeSource: 'manuel',
      })

      res.status(201).json(result)
    } catch (err) {
      console.error('Erreur POST notification:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
)

// POST /api/notifications/relance-facture/:id (bloqué pendant l'essai)
router.post(
  '/relance-facture/:id',
  verifierEcriture,
  verifierQuota('notifications'),
  async (req, res) => {
    try {
      const { canal = 'whatsapp' } = req.body

      const result = await query(`
        SELECT f.*, c.nom AS client_nom, c.telephone AS client_telephone, c.email AS client_email
        FROM factures f JOIN clients c ON f.client_id = c.id
        WHERE f.id = $1 AND f.entreprise_id = $2 AND f.supprime_le IS NULL
      `, [req.params.id, req.entrepriseId])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Facture non trouvée' })
      }

      const f = result.rows[0]
      if (!f.client_telephone) {
        return res.status(400).json({ error: 'Le client n\'a pas de téléphone' })
      }

      const notif = await notifService.relancerFacture(f, f, req.entrepriseId, canal)
      res.status(201).json(notif)
    } catch (err) {
      console.error('Erreur relance facture:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
)

// POST /api/notifications/rappel-credit/:id (bloqué pendant l'essai)
router.post(
  '/rappel-credit/:id',
  verifierEcriture,
  verifierQuota('notifications'),
  async (req, res) => {
    try {
      const { canal = 'whatsapp' } = req.body

      const result = await query(`
        SELECT cr.*, cl.nom AS client_nom, cl.telephone AS client_telephone
        FROM credits cr JOIN clients cl ON cr.client_id = cl.id
        WHERE cr.id = $1 AND cr.entreprise_id = $2 AND cr.supprime_le IS NULL
      `, [req.params.id, req.entrepriseId])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Crédit non trouvé' })
      }

      const c = result.rows[0]
      if (!c.client_telephone) {
        return res.status(400).json({ error: 'Le client n\'a pas de téléphone' })
      }

      const notif = await notifService.rappelerCredit(c, c, req.entrepriseId, canal)
      res.status(201).json(notif)
    } catch (err) {
      console.error('Erreur rappel credit:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
)

// POST /api/notifications/relances-auto — Déclencher manuellement
router.post(
  '/relances-auto',
  requireRole('proprietaire', 'admin'),
  verifierEcriture,
  verifierQuota('notifications'),
  async (req, res) => {
    try {
      await notifService.executerRelancesAuto()
      res.json({ message: 'Relances automatiques exécutées' })
    } catch (err) {
      console.error('Erreur relances auto:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  }
)

// DELETE /api/notifications/:id — suppression logique
router.delete('/:id', verifierEcriture, async (req, res) => {
  try {
    const result = await query(
      `UPDATE notifications SET supprime_le = NOW(), supprime_par = $1
       WHERE id = $2 AND entreprise_id = $3 AND supprime_le IS NULL RETURNING id`,
      [req.user.id, req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' })
    }
    res.json({ message: 'Notification supprimée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router