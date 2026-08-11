/**
 * Service de paiements Stripe
 * Gere les paiements par carte bancaire
 */

const https = require('https')

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''

// Creer une session de paiement Stripe
async function creerSessionPaiement({ montant, description, facture_id, client_email, currency = 'xaf' }) {
  if (!STRIPE_SECRET) {
    console.log('[Stripe] Mode simulation — pas de cle API configuree')
    return {
      succes: true,
      provider: 'stripe_simule',
      session_id: `sim_stripe_${Date.now()}`,
      url_paiement: null,
      message: 'Mode simulation — configurez STRIPE_SECRET_KEY pour la production',
    }
  }

  try {
    // En prod : appeler l'API Stripe
    const body = JSON.stringify({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: { name: description },
          unit_amount: montant,
        },
        quantity: 1,
      }],
      metadata: { facture_id, client_email },
      success_url: `${process.env.FRONTEND_URL}/app/facturation?paiement=ok`,
      cancel_url: `${process.env.FRONTEND_URL}/app/facturation?paiement=annule`,
    })

    const result = await faireRequeteStripe('/v1/checkout/sessions', body)
    return {
      succes: true,
      provider: 'stripe',
      session_id: result.id,
      url_paiement: result.url,
    }
  } catch (err) {
    console.error('[Stripe] Erreur:', err.message)
    return { succes: false, erreur: err.message }
  }
}

// Verifier le statut d'un paiement Stripe
async function verifierPaiement(session_id) {
  if (!STRIPE_SECRET) {
    return { succes: true, statut: 'paye', provider: 'stripe_simule' }
  }

  try {
    const result = await faireRequeteStripe(`/v1/checkout/sessions/${session_id}`)
    return {
      succes: true,
      statut: result.payment_status === 'paid' ? 'paye' : 'en_attente',
      montant: result.amount_total,
      provider: 'stripe',
    }
  } catch (err) {
    return { succes: false, erreur: err.message }
  }
}

// Webhook Stripe (verification de signature)
function verifierWebhook(payload, signature) {
  // En prod : verifier la signature avec stripe.webhooks.constructEvent
  // Pour l'instant, on accepte tout en dev
  if (process.env.NODE_ENV !== 'production') {
    return { valide: true, data: JSON.parse(payload) }
  }
  // TODO: integrer stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
  return { valide: true, data: JSON.parse(payload) }
}

// Helper pour les requetes Stripe
function faireRequeteStripe(endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.stripe.com',
      path: endpoint,
      method: body ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) reject(new Error(parsed.error.message))
          else resolve(parsed)
        } catch (e) {
          reject(new Error('Reponse invalide de Stripe'))
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(new URLSearchParams(body).toString())
    req.end()
  })
}

module.exports = { creerSessionPaiement, verifierPaiement, verifierWebhook }
