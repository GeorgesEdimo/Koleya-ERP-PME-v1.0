// Configuration des 9 types de documents de facturation + métadonnées
// Utilisé par NouvelleFacture, DocumentPreview, templateEngine, Facturation.jsx

export const DOCUMENT_TYPES = [
  { type: 'facture', label: 'Facture', prefix: 'FAC', cat: 'Factures', showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
  { type: 'facture_fiscale', label: 'Facture fiscale', prefix: 'FIS', cat: 'Factures', showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
  { type: 'facture_proforma', label: 'Facture proforma', prefix: 'PRO', cat: 'Factures', showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
  { type: 'recu', label: 'Reçu', prefix: 'REC', cat: 'Reçus', showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
  { type: 'recu_vente', label: 'Reçu de vente', prefix: 'REV', cat: 'Reçus', showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
  { type: 'recu_caisse', label: 'Reçu de caisse', prefix: 'RCA', cat: 'Reçus', showExpiry: false, showCommande: false, showEnvoye: false, showTaxe: false, hasTable: true },
  { type: 'devis', label: 'Devis', prefix: 'DEV', cat: 'Devis', showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true, isDevis: true },
  { type: 'note_credit', label: 'Note de crédit', prefix: 'NDC', cat: 'Avoirs', showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
  { type: 'bon_commande', label: 'Bon de commande', prefix: 'BCM', cat: 'Bons', showExpiry: false, showCommande: false, showEnvoye: true, showTaxe: true, hasTable: true },
  { type: 'bon_livraison', label: 'Bon de livraison', prefix: 'BLV', cat: 'Bons', showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
]

export const TEMPLATES = [
  { id: 'classique-bleu', label: 'Classique Bleu', desc: 'Professionnel, bleu institutionnel' },
  { id: 'classique-blanc', label: 'Classique Blanc', desc: 'Minimaliste, élégant' },
  { id: 'moderne-rouge', label: 'Moderne Rouge', desc: 'Dynamique, commercial' },
  { id: 'mono-noir', label: 'Mono Noir', desc: 'Épuré, sobre' },
  { id: 'orange-militaire', label: 'Orange Militaire', desc: 'Vigoureux, BTP' },
  { id: 'bande-bleu', label: 'Bande Bleu', desc: 'Moderne, bandeau coloré' },
]

export const DEVISES = [
  { code: 'XAF', label: 'FCFA (XAF)', symbol: 'FCFA' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { code: 'USD', label: 'Dollar (USD)', symbol: '$' },
  { code: 'NGN', label: 'Naira (NGN)', symbol: '₦' },
  { code: 'XOF', label: 'Franc CFA BCEAO (XOF)', symbol: 'FCFA' },
]

export const TYPE_LABELS = {
  'facture': 'FACTURE',
  'facture_fiscale': 'FACTURE FISCALE',
  'facture_proforma': 'FACTURE PROFORMA',
  'recu': 'REÇU',
  'recu_vente': 'REÇU DE VENTE',
  'recu_caisse': 'REÇU DE CAISSE',
  'devis': 'DEVIS',
  'note_credit': 'NOTE DE CRÉDIT',
  'bon_commande': 'BON DE COMMANDE',
  'bon_livraison': 'BON DE LIVRAISON',
}

export const DEST_LABELS = {
  'facture': 'Facturer à',
  'facture_fiscale': 'Facturer à',
  'facture_proforma': 'Facturer à',
  'recu': 'Reçu de',
  'recu_vente': 'Reçu de',
  'recu_caisse': 'Reçu par',
  'devis': 'Devis pour',
  'note_credit': 'Avoir pour',
  'bon_commande': 'Vendeur',
  'bon_livraison': 'Livrer à',
}

export const getDocConfig = (type) => DOCUMENT_TYPES.find(d => d.type === type) || DOCUMENT_TYPES[0]

export const formatMontant = (n, devise = 'XAF') => {
  const symbol = (DEVISES.find(d => d.code === devise) || DEVISES[0]).symbol
  const montant = new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0))
  return devise === 'XAF' || devise === 'XOF' ? `${montant} ${symbol}` : `${symbol} ${montant}`
}
