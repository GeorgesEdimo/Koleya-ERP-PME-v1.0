const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture } = require('../middleware/abonnement')

const router = express.Router()
router.use(authenticate, attacherAbonnement)

// GET /api/stats/dashboard (les statistiques excluent les éléments supprimés)
router.get('/dashboard', async (req, res) => {
  try {
    const eid = req.entrepriseId

    const [caResult, encaisseResult, impayeResult, nbFacturesResult, creditsResult, stockResult, employesResult, depensesResult] = await Promise.all([
      // Chiffre d'affaires total
      query("SELECT COALESCE(SUM(total), 0) AS total FROM factures WHERE entreprise_id = $1 AND type = 'facture' AND supprime_le IS NULL", [eid]),
      // Encaissé
      query("SELECT COALESCE(SUM(paye), 0) AS total FROM factures WHERE entreprise_id = $1 AND type = 'facture' AND supprime_le IS NULL", [eid]),
      // Impayés
      query("SELECT COALESCE(SUM(reste), 0) AS total FROM factures WHERE entreprise_id = $1 AND type = 'facture' AND reste > 0 AND supprime_le IS NULL", [eid]),
      // Nombre de factures
      query("SELECT COUNT(*) AS total FROM factures WHERE entreprise_id = $1 AND type = 'facture' AND supprime_le IS NULL", [eid]),
      // Crédits en cours
      query("SELECT COUNT(*) AS nb, COALESCE(SUM(reste), 0) AS total FROM credits WHERE entreprise_id = $1 AND statut IN ('en_cours', 'en_retard') AND supprime_le IS NULL", [eid]),
      // Valeur stock
      query("SELECT COALESCE(SUM(stock * prix_achat), 0) AS valeur, COUNT(*) AS nb, COUNT(*) FILTER (WHERE stock <= stock_min) AS alertes FROM produits WHERE entreprise_id = $1 AND supprime_le IS NULL", [eid]),
      // Employés
      query("SELECT COUNT(*) AS nb, COALESCE(SUM(salaire), 0) AS masse_salariale FROM employes WHERE entreprise_id = $1 AND statut = 'actif' AND supprime_le IS NULL", [eid]),
      // Dépenses du mois
      query("SELECT COALESCE(SUM(montant), 0) AS total FROM depenses WHERE entreprise_id = $1 AND date >= DATE_TRUNC('month', NOW()) AND supprime_le IS NULL", [eid]),
    ])

    res.json({
      chiffreAffaires: parseInt(caResult.rows[0].total),
      encaisse: parseInt(encaisseResult.rows[0].total),
      impaye: parseInt(impayeResult.rows[0].total),
      nbFactures: parseInt(nbFacturesResult.rows[0].total),
      creditsEnCours: parseInt(creditsResult.rows[0].total),
      nbCreditsEnCours: parseInt(creditsResult.rows[0].nb),
      valeurStock: parseInt(stockResult.rows[0].valeur),
      nbProduits: parseInt(stockResult.rows[0].nb),
      alertesStock: parseInt(stockResult.rows[0].alertes),
      nbEmployes: parseInt(employesResult.rows[0].nb),
      masseSalariale: parseInt(employesResult.rows[0].masse_salariale),
      totalDepenses: parseInt(depensesResult.rows[0].total),
    })
  } catch (err) {
    console.error('Erreur GET stats:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/stats/entreprise
router.get('/entreprise', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM entreprises WHERE id = $1',
      [req.entrepriseId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvee' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/stats/entreprise
router.put('/entreprise', verifierEcriture, async (req, res) => {
  try {
    const { nom, adresse, telephone, email, nrcc, logo, cachet, devise, tva, prefixe_facture, prefixe_devis, delai_paiement } = req.body
    const result = await query(
      `UPDATE entreprises SET
        nom = COALESCE($1, nom), adresse = COALESCE($2, adresse),
        telephone = COALESCE($3, telephone), email = COALESCE($4, email),
        nrcc = COALESCE($5, nrcc), logo = COALESCE($6, logo),
        cachet = COALESCE($7, cachet), devise = COALESCE($8, devise),
        tva = COALESCE($9, tva), prefixe_facture = COALESCE($10, prefixe_facture),
        prefixe_devis = COALESCE($11, prefixe_devis), delai_paiement = COALESCE($12, delai_paiement),
        mis_a_jour_le = NOW()
       WHERE id = $13 RETURNING *`,
      [nom, adresse, telephone, email, nrcc, logo, cachet, devise, tva, prefixe_facture, prefixe_devis, delai_paiement, req.entrepriseId]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
