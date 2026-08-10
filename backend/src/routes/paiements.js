const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const paiementService = require('../services/paiementService')

const router = express.Router()
router.use(authenticate)

// POST /api/paiements/creer — Initier un paiement
router.post('/creer', async (req, res) => {
  try {
    const { facture_id, montant, methode } = req.body
    if (!facture_id || !montant) {
      return res.status(400).json({ error: 'Facture et montant requis' })
    }

    // Recuperer la facture et le client
    const result = await query(`
      SELECT f.*, c.nom AS client_nom, c.telephone AS client_telephone, c.email AS client_email,
             e.pays_code, e.nom AS entreprise_nom
      FROM factures f
      JOIN clients c ON f.client_id = c.id
      JOIN entreprises e ON f.entreprise_id = e.id
      WHERE f.id = $1 AND f.entreprise_id = $2
    `, [facture_id, req.entrepriseId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvee' })
    }

    const facture = result.rows[0]
    if (montant > facture.reste) {
      return res.status(400).json({ error: 'Le montant depasse le reste a payer' })
    }

    // Generer l'ID de transaction
    const transaction_id = `KOLEYA-${facture.numero}-${Date.now()}`

    // Creer le paiement via le service (failover CinetPay → Flutterwave)
    const paiement = await paiementService.creerPaiement({
      transaction_id,
      montant: parseInt(montant),
      description: `Paiement facture ${facture.numero} — ${facture.client_nom}`,
      client_nom: facture.client_nom,
      client_telephone: facture.client_telephone,
      client_email: facture.client_email,
    })

    // Enregistrer la tentative de paiement
    await query(
      `INSERT INTO paiements (entreprise_id, facture_id, montant, methode, transaction_id, provider, statut, reponse_api)
       VALUES ($1, $2, $3, $4, $5, $6, 'en_attente', $7)`,
      [req.entrepriseId, facture_id, montant, methode || 'mobile_money', transaction_id, paiement.provider, JSON.stringify(paiement.reponse)]
    )

    res.json({
      transaction_id,
      payment_url: paiement.payment_url,
      provider: paiement.provider,
      montant,
      succes: paiement.succes,
    })
  } catch (err) {
    console.error('Erreur creer paiement:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/paiements/verifier/:transaction_id
router.get('/verifier/:transaction_id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM paiements WHERE transaction_id = $1 AND entreprise_id = $2',
      [req.params.transaction_id, req.entrepriseId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvee' })
    }

    const paiement = result.rows[0]
    const verification = await paiementService.verifierPaiement(
      req.params.transaction_id,
      paiement.provider
    )

    // Mettre a jour le statut
    if (verification.statut === 'paye') {
      await query(
        `UPDATE paiements SET statut = 'paye', date_paiement = NOW() WHERE transaction_id = $1`,
        [req.params.transaction_id]
      )

      // Mettre a jour la facture
      const facture = await query('SELECT * FROM factures WHERE id = $1', [paiement.facture_id])
      if (facture.rows.length > 0) {
        const f = facture.rows[0]
        const nouveauPaye = parseFloat(f.paye) + parseFloat(paiement.montant)
        const nouveauStatut = nouveauPaye >= f.total ? 'payee' : 'en_attente'
        await query(
          'UPDATE factures SET paye = $1, reste = total - $1, statut = $2 WHERE id = $3',
          [nouveauPaye, nouveauStatut, f.id]
        )
      }
    } else if (verification.statut === 'echec') {
      await query(
        `UPDATE paiements SET statut = 'echec' WHERE transaction_id = $1`,
        [req.params.transaction_id]
      )
    }

    res.json({
      transaction_id: req.params.transaction_id,
      statut: verification.statut,
      provider: paiement.provider,
      montant: paiement.montant,
    })
  } catch (err) {
    console.error('Erreur verifier paiement:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/paiements/callback/cinetpay — Webhook CinetPay
router.post('/callback/cinetpay', async (req, res) => {
  try {
    const { cpm_trans_status, cpm_amount, cpm_custom } = req.body
    console.log('[Callback CinetPay]', req.body)

    if (cpm_trans_status === 'SUCCESS') {
      // Traiter le succes
      console.log(`[CinetPay] Paiement reussi: ${cpm_custom} — ${cpm_amount} XAF`)
    }

    res.json({ status: 'received' })
  } catch (err) {
    console.error('Erreur callback CinetPay:', err)
    res.json({ status: 'error' })
  }
})

// POST /api/paiements/callback/flutterwave — Webhook Flutterwave
router.post('/callback/flutterwave', async (req, res) => {
  try {
    const { event, data } = req.body
    console.log('[Callback Flutterwave]', event, data?.tx_ref)

    if (event === 'charge.completed' && data?.status === 'successful') {
      console.log(`[Flutterwave] Paiement reussi: ${data.tx_ref} — ${data.amount} ${data.currency}`)
    }

    res.json({ status: 'received' })
  } catch (err) {
    console.error('Erreur callback Flutterwave:', err)
    res.json({ status: 'error' })
  }
})

// GET /api/paiements/historique
router.get('/historique', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, f.numero AS facture_numero, c.nom AS client_nom
       FROM paiements p
       JOIN factures f ON p.facture_id = f.id
       JOIN clients c ON f.client_id = c.id
       WHERE p.entreprise_id = $1
       ORDER BY p.cree_le DESC
       LIMIT 50`,
      [req.entrepriseId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
