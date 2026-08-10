/**
 * Service de notifications SMS/WhatsApp
 *
 * Provider abstrait — en prod, brancher Africa's Talking, Twilio, ou WhatsApp Business API.
 * En dev, log console + enregistrement en base.
 */

const { query } = require('../config/database')

// =============================================
// ENVOI SMS/WHATSAPP (provider abstrait)
// =============================================
async function envoyerMessage({ canal, destinataire, message, sujet }) {
  // En développement : log console + simulation
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n📱 [${canal.toUpperCase()}]`)
    console.log(`   Destinataire: ${destinataire}`)
    if (sujet) console.log(`   Sujet: ${sujet}`)
    console.log(`   Message: ${message}`)
    console.log(`   ✅ Envoye (simulation)\n`)
    return { succes: true, messageId: `sim_${Date.now()}` }
  }

  // En production — exemple avec Africa's Talking
  // Décommenter et configurer en prod :
  /*
  const Africastalking = require('africastalking')
  const at = Africastalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  })

  if (canal === 'sms') {
    const result = await at.SMS.send({
      to: [destinataire],
      message,
      from: process.env.AT_SENDER_ID,
    })
    return { succes: true, messageId: result.SMSMessageData?.recipients?.[0]?.messageId }
  }

  if (canal === 'whatsapp') {
    // WhatsApp Business API ou integraion tierce
    // A adapter selon le provider choisi
  }
  */

  return { succes: false, erreur: 'Provider non configure' }
}

// =============================================
// ENREGISTRER UNE NOTIFICATION
// =============================================
async function enregistrerNotification({ entrepriseId, canal, destinataire, destinataireNom, sujet, message, typeSource, sourceId }) {
  const result = await query(
    `INSERT INTO notifications (entreprise_id, canal, destinataire, destinataire_nom, sujet, message, type_source, source_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [entrepriseId, canal, destinataire, destinataireNom, sujet, message, typeSource, sourceId]
  )
  return result.rows[0]
}

// =============================================
// ENVOYER ET ENREGISTRER
// =============================================
async function envoyerNotification({ entrepriseId, canal, destinataire, destinataireNom, sujet, message, typeSource, sourceId }) {
  // Enregistrer d'abord (statut: en_attente)
  const notif = await enregistrerNotification({
    entrepriseId, canal, destinataire, destinataireNom, sujet, message, typeSource, sourceId
  })

  // Envoyer
  const resultat = await envoyerMessage({ canal, destinataire, message, sujet })

  if (resultat.succes) {
    await query(
      `UPDATE notifications SET statut = 'envoye', date_envoi = NOW(), reponse_api = $1 WHERE id = $2`,
      [JSON.stringify(resultat), notif.id]
    )
  } else {
    await query(
      `UPDATE notifications SET statut = 'echec', erreur = $1 WHERE id = $2`,
      [resultat.erreur || 'Echec envoi', notif.id]
    )
  }

  return { ...notif, statut: resultat.succes ? 'envoye' : 'echec' }
}

// =============================================
// RELANCE FACTURE IMPAYEE
// =============================================
async function relancerFacture(facture, client, entrepriseId, canal = 'whatsapp') {
  const montantReste = new Intl.NumberFormat('fr-CM').format(facture.reste) + ' FCFA'
  const message = `Bonjour ${client.nom},\n\nNous vous rappelons que la facture ${facture.numero} d'un montant de ${montantReste} reste impayee.\nEcheance: ${facture.echeance}\n\nMerci de regulariser votre situation.\n\n${client.email || ''}`

  return envoyerNotification({
    entrepriseId,
    canal,
    destinataire: client.telephone,
    destinataireNom: client.nom,
    sujet: `Relance facture ${facture.numero}`,
    message,
    typeSource: 'facture_relance',
    sourceId: facture.id,
  })
}

// =============================================
// RAPPEL CREDIT
// =============================================
async function rappelerCredit(credit, client, entrepriseId, canal = 'whatsapp') {
  const montantReste = new Intl.NumberFormat('fr-CM').format(credit.reste) + ' FCFA'
  const message = `Bonjour ${client.nom},\n\nRappel: votre solde de ${montantReste} reste a payer.\nMerci de vous acquitter de votre dette.\n\nMerci.`

  return envoyerNotification({
    entrepriseId,
    canal,
    destinataire: client.telephone,
    destinataireNom: client.nom,
    sujet: `Rappel credit`,
    message,
    typeSource: 'credit_rappel',
    sourceId: credit.id,
  })
}

// =============================================
// ALERTE STOCK
// =============================================
async function alerterStock(produit, entrepriseId, telephoneDest, canal = 'sms') {
  const message = `[Stock] ${produit.nom} (ref: ${produit.reference}) - ${produit.stock} restant(s) / min: ${produit.stock_min}. Reapprovisionnez!`

  return envoyerNotification({
    entrepriseId,
    canal,
    destinataire: telephoneDest,
    destinataireNom: 'Gestionnaire stock',
    sujet: `Alerte stock: ${produit.nom}`,
    message,
    typeSource: 'stock_alerte',
    sourceId: produit.id,
  })
}

// =============================================
// RELANCES AUTOMATIQUES (batch)
// =============================================
async function executerRelancesAuto() {
  console.log('[Notif] Execution des relances automatiques...')

  // 1. Factures en retard
  const facturesRetard = await query(`
    SELECT f.id, f.numero, f.reste, f.echeance,
           c.nom AS client_nom, c.telephone AS client_telephone,
           e.id AS entreprise_id
    FROM factures f
    JOIN clients c ON f.client_id = c.id
    JOIN entreprises e ON f.entreprise_id = e.id
    WHERE f.type = 'facture' AND f.statut = 'en_retard' AND f.reste > 0
    AND c.telephone IS NOT NULL
  `)

  for (const f of facturesRetard.rows) {
    // Vérifier si déjà relancé aujourd'hui
    const dejaRelance = await query(
      `SELECT id FROM notifications
       WHERE source_id = $1 AND type_source = 'facture_relance'
       AND DATE(cree_le) = CURRENT_DATE`,
      [f.id]
    )
    if (dejaRelance.rows.length === 0) {
      await relancerFacture(f, f, f.entreprise_id)
    }
  }

  // 2. Credits en retard
  const creditsRetard = await query(`
    SELECT cr.id, cr.reste,
           cl.nom AS client_nom, cl.telephone AS client_telephone,
           cr.entreprise_id
    FROM credits cr
    JOIN clients cl ON cr.client_id = cl.id
    WHERE cr.statut IN ('en_retard', 'en_cours') AND cr.reste > 0
    AND cl.telephone IS NOT NULL
    AND cr.echeance < CURRENT_DATE
  `)

  for (const c of creditsRetard.rows) {
    const dejaRelance = await query(
      `SELECT id FROM notifications
       WHERE source_id = $1 AND type_source = 'credit_rappel'
       AND DATE(cree_le) = CURRENT_DATE`,
      [c.id]
    )
    if (dejaRelance.rows.length === 0) {
      await rappelerCredit(c, c, c.entreprise_id)
    }
  }

  // 3. Alertes stock
  const alertesStock = await query(`
    SELECT p.id, p.nom, p.reference, p.stock, p.stock_min,
           e.id AS entreprise_id, e.telephone AS entreprise_telephone
    FROM produits p
    JOIN entreprises e ON p.entreprise_id = e.id
    WHERE p.stock <= p.stock_min AND e.telephone IS NOT NULL
  `)

  for (const p of alertesStock.rows) {
    const dejaAlerte = await query(
      `SELECT id FROM notifications
       WHERE source_id = $1 AND type_source = 'stock_alerte'
       AND DATE(cree_le) = CURRENT_DATE`,
      [p.id]
    )
    if (dejaAlerte.rows.length === 0) {
      await alerterStock(p, p.entreprise_id, p.entreprise_telephone, 'sms')
    }
  }

  console.log(`[Notif] Termine: ${facturesRetard.rows.length} factures, ${creditsRetard.rows.length} credits, ${alertesStock.rows.length} alertes stock`)
}

module.exports = {
  envoyerNotification,
  relancerFacture,
  rappelerCredit,
  alerterStock,
  executerRelancesAuto,
}
