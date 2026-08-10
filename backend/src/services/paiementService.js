/**
 * Service de paiement Koleya
 * Principal : CinetPay | Backup : Flutterwave
 *
 * Architecture failover : si CinetPay echoue, bascule sur Flutterwave
 */

const https = require('https')
const http = require('http')

// =============================================
// CONFIGURATION
// =============================================
const config = {
  cinetpay: {
    baseUrl: 'https://api.cinetpay.com/v2',
    app_id: process.env.CINETPAY_APP_ID || '',
    api_key: process.env.CINETPAY_API_KEY || '',
    site_id: process.env.CINETPAY_SITE_ID || '',
    enabled: true,
  },
  flutterwave: {
    baseUrl: 'https://api.flutterwave.com/v3',
    secret_key: process.env.FLUTTERWAVE_SECRET_KEY || '',
    public_key: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
    enabled: true,
  },
}

// =============================================
// UTILITAIRES
// =============================================
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http

    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve({ raw: data })
        }
      })
    })

    req.on('error', reject)
    if (options.body) req.write(JSON.stringify(options.body))
    req.end()
  })
}

// =============================================
// CINETPAY — Principal
// =============================================
async function creerPaiementCinetPay({ transaction_id, montant, description, client_nom, client_telephone, client_email }) {
  const result = await makeRequest(`${config.cinetpay.baseUrl}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.cinetpay.api_key,
    },
    body: {
      app_id: config.cinetpay.app_id,
      site_id: config.cinetpay.site_id,
      transaction_id,
      amount: montant,
      currency: 'XAF',
      description,
      customer_name: client_nom,
      customer_phone_number: client_telephone,
      customer_email: client_email,
      channels: ['MOBILE_MONEY', 'CARD'],
      callback_url: `${process.env.APP_URL || 'http://localhost:3001'}/api/paiements/callback/cinetpay`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/facturation`,
    },
  })

  return {
    succes: result.code === 201 || result.code === 200,
    provider: 'cinetpay',
    payment_url: result.data?.payment_url,
    transaction_id,
    reponse: result,
  }
}

async function verifierPaiementCinetPay(transaction_id) {
  const result = await makeRequest(
    `${config.cinetpay.baseUrl}/payment/${config.cinetpay.site_id}/${transaction_id}`,
    {
      method: 'GET',
      headers: {
        'X-API-KEY': config.cinetpay.api_key,
      },
    }
  )

  const statut = result.data?.status
  return {
    succes: true,
    provider: 'cinetpay',
    statut: statut === 'ACCEPTED' ? 'paye' : statut === 'REFUSED' ? 'echec' : 'en_attente',
    montant: result.data?.amount,
    reponse: result,
  }
}

// =============================================
// FLUTTERWAVE — Backup
// =============================================
async function creerPaiementFlutterwave({ transaction_id, montant, description, client_nom, client_telephone, client_email }) {
  const result = await makeRequest(`${config.flutterwave.baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.flutterwave.secret_key}`,
    },
    body: {
      tx_ref: transaction_id,
      amount: montant,
      currency: 'XAF',
      redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/facturation`,
      customer: {
        email: client_email || `${client_telephone}@koleya.cm`,
        name: client_nom,
        phone_number: client_telephone,
      },
      customizations: {
        title: 'Koleya — Paiement',
        description,
      },
    },
  })

  return {
    succes: result.status === 'success',
    provider: 'flutterwave',
    payment_url: result.data?.link,
    transaction_id,
    reponse: result,
  }
}

async function verifierPaiementFlutterwave(transaction_id) {
  const result = await makeRequest(
    `${config.flutterwave.baseUrl}/transactions/verify?tx_ref=${transaction_id}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.flutterwave.secret_key}`,
      },
    }
  )

  const statut = result.data?.status
  return {
    succes: true,
    provider: 'flutterwave',
    statut: statut === 'successful' ? 'paye' : statut === 'failed' ? 'echec' : 'en_attente',
    montant: result.data?.amount,
    reponse: result,
  }
}

// =============================================
// FAILOVER — CinetPay → Flutterwave
// =============================================
async function creerPaiement(params) {
  // 1. Essayer CinetPay (principal)
  if (config.cinetpay.enabled && config.cinetpay.api_key) {
    try {
      const result = await creerPaiementCinetPay(params)
      if (result.succes && result.payment_url) {
        console.log(`[Paiement] CinetPay OK — ${params.transaction_id}`)
        return result
      }
      console.warn(`[Paiement] CinetPay echec, bascule Flutterwave...`)
    } catch (err) {
      console.error(`[Paiement] CinetPay erreur: ${err.message}, bascule Flutterwave...`)
    }
  }

  // 2. Bascule sur Flutterwave (backup)
  if (config.flutterwave.enabled && config.flutterwave.secret_key) {
    try {
      const result = await creerPaiementFlutterwave(params)
      if (result.succes && result.payment_url) {
        console.log(`[Paiement] Flutterwave OK (backup) — ${params.transaction_id}`)
        return result
      }
      console.error(`[Paiement] Flutterwave echec aussi`)
    } catch (err) {
      console.error(`[Paiement] Flutterwave erreur: ${err.message}`)
    }
  }

  return {
    succes: false,
    provider: null,
    erreur: 'Aucun fournisseur de paiement disponible',
  }
}

async function verifierPaiement(transaction_id, provider) {
  if (provider === 'cinetpay' || (!provider && config.cinetpay.enabled)) {
    try {
      return await verifierPaiementCinetPay(transaction_id)
    } catch (err) {
      console.error(`[Verification] CinetPay erreur: ${err.message}`)
    }
  }

  if (provider === 'flutterwave' || (!provider && config.flutterwave.enabled)) {
    try {
      return await verifierPaiementFlutterwave(transaction_id)
    } catch (err) {
      console.error(`[Verification] Flutterwave erreur: ${err.message}`)
    }
  }

  return { succes: false, erreur: 'Impossible de verifier le paiement' }
}

// =============================================
// CONFIGURATION PAR PAYS
// =============================================
const PAYMENT_CONFIG = {
  CM: { nom: 'Cameroun', devise: 'XAF', providers: ['cinetpay', 'flutterwave'], mobile_money: ['MTN', 'Orange'] },
  GA: { nom: 'Gabon', devise: 'XAF', providers: ['cinetpay', 'flutterwave'], mobile_money: ['MTN', 'Airtel'] },
  CG: { nom: 'Congo', devise: 'XAF', providers: ['cinetpay', 'flutterwave'], mobile_money: ['MTN', 'Airtel'] },
  CI: { nom: "Cote d'Ivoire", devise: 'XOF', providers: ['cinetpay', 'flutterwave'], mobile_money: ['MTN', 'Orange', 'Wave'] },
  SN: { nom: 'Senegal', devise: 'XOF', providers: ['cinetpay', 'flutterwave'], mobile_money: ['Orange', 'Wave', 'Free'] },
  NG: { nom: 'Nigeria', devise: 'NGN', providers: ['flutterwave'], mobile_money: ['MTN', 'Airtel', '9mobile'], notes: 'Flutterwave principal au Nigeria' },
}

function getConfigPays(codePays) {
  return PAYMENT_CONFIG[codePays] || PAYMENT_CONFIG.CM
}

module.exports = {
  creerPaiement,
  verifierPaiement,
  getConfigPays,
  PAYMENT_CONFIG,
}
