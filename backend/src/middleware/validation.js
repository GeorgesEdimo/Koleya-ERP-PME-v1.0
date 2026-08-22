const { z } = require('zod')

// =============================================
// Schémas de validation des entrées (zod v3)
// Règle : les validateurs (.min/.max/.email/.uuid)
// sont TOUJOURS appliqués AVANT .optional()/.nullable().
// =============================================

const emailSchema = z.string().email('Email invalide').max(255)
const uuidSchema = z.string().uuid('Identifiant invalide')

// AUTH
const signupSchema = z.object({
  email: emailSchema,
  mot_de_passe: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(200),
  nom: z.string().min(1, 'Le nom est requis').max(255),
  telephone: z.string().max(50).optional().nullable(),
  entreprise_nom: z.string().max(255).optional().nullable(),
})
const loginSchema = z.object({
  email: emailSchema,
  mot_de_passe: z.string().min(1, 'Le mot de passe est requis'),
})

// CLIENTS
const clientCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255),
  telephone: z.string().max(50).optional().nullable(),
  email: z.string().email('Email invalide').max(255).optional().nullable().or(z.literal('')),
  adresse: z.string().max(500).optional().nullable(),
})
const clientUpdateSchema = clientCreateSchema.partial()

// FACTURES / DEVIS — 9 types de documents
const TYPE_DOCUMENT = [
  'facture', 'facture_fiscale', 'facture_proforma',
  'recu', 'recu_vente', 'recu_caisse',
  'devis', 'note_credit', 'bon_commande', 'bon_livraison',
]

const ligneSchema = z.object({
  description: z.string().min(1, 'La description est requise').max(500),
  quantite: z.number().int().min(1, 'La quantité doit être ≥ 1'),
  prix_unitaire: z.number().min(0, 'Le prix unitaire doit être ≥ 0'),
  taux_tva: z.number().min(0).max(100).default(0).optional(),
  remise_pct: z.number().min(0).max(100).default(0).optional(),
  montant_ht: z.number().optional(),
  montant_ttc: z.number().optional(),
})
const factureCreateSchema = z.object({
  client_id: uuidSchema,
  type: z.enum(TYPE_DOCUMENT).default('facture'),
  date: z.string().optional(),
  echeance: z.string().nullable().optional(),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(ligneSchema).min(1, 'Au moins un article est requis').max(200),
  remise_globale: z.number().min(0).max(100).default(0).optional(),
  devise: z.string().length(3).default('XAF').optional(),
  template_style: z.enum(['classique-bleu', 'classique-blanc', 'moderne-rouge', 'mono-noir', 'orange-militaire', 'bande-bleu']).default('classique-bleu').optional(),
  // Devis metadata
  mode_calcul: z.enum(['prix_unitaire', 'prix_m2', 'prix_heure', 'forfait']).optional(),
  surface: z.number().min(0).optional(),
  taux: z.number().min(0).optional(),
  duree: z.number().int().min(1).optional(),
  nb_intervenants: z.number().int().min(1).optional(),
  mention: z.string().max(500).optional().nullable(),
  validite_jours: z.number().int().min(1).max(365).optional(),
})
const factureUpdateSchema = z.object({
  statut: z.enum(['brouillon', 'en_attente', 'payee', 'en_retard', 'annule', 'valide', 'refuse']).optional(),
  paye: z.number().min(0).optional(),
  notes: z.string().max(2000).optional().nullable(),
  remise_globale: z.number().min(0).max(100).optional(),
  template_style: z.enum(['classique-bleu', 'classique-blanc', 'moderne-rouge', 'mono-noir', 'orange-militaire', 'bande-bleu']).optional(),
})

// CREDITS
const creditCreateSchema = z.object({
  client_id: uuidSchema,
  montant_total: z.number().positive('Le montant doit être positif'),
  echeance: z.string().nullable().optional(),
  description: z.string().max(2000).optional().nullable(),
})
const paiementSchema = z.object({
  montant: z.number().positive('Le montant du paiement doit être positif'),
  methode: z.string().max(50).default('especes'),
})

// PRODUITS
const produitCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255),
  reference: z.string().max(100).optional().nullable(),
  categorie: z.string().max(100).optional().nullable(),
  stock: z.number().int().min(0).default(0),
  stock_min: z.number().int().min(0).default(0),
  prix_achat: z.number().min(0).default(0),
  prix_vente: z.number().min(0).default(0),
  fournisseur: z.string().max(255).optional().nullable(),
})
const produitUpdateSchema = produitCreateSchema.partial()
const ajusterStockSchema = z.object({ quantite: z.number().int().min(-999999).max(999999) })

// EMPLOYES
const employeCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255),
  poste: z.string().max(255).optional().nullable(),
  salaire: z.number().min(0).default(0),
  date_embauche: z.string().nullable().optional(),
  telephone: z.string().max(50).optional().nullable(),
})
const employeUpdateSchema = employeCreateSchema.partial()

// DEPENSES
const depenseCreateSchema = z.object({
  categorie: z.string().min(1, 'La catégorie est requise').max(100),
  description: z.string().max(2000).optional().nullable(),
  montant: z.number().positive('Le montant doit être positif'),
  date: z.string().optional(),
})

// ABONNEMENT
const payerSchema = z.object({
  plan: z.enum(['starter', 'pro', 'business']),
})

// Middleware : valide req.body contre le schéma
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const issue = result.error.issues[0]
      const champ = issue.path.join('.') || 'données'
      const message = issue.message || 'invalide'
      return res.status(400).json({ error: `Le champ « ${champ} » : ${message}` })
    }
    req.body = result.data
    next()
  }
}

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  clientCreateSchema,
  clientUpdateSchema,
  factureCreateSchema,
  factureUpdateSchema,
  creditCreateSchema,
  paiementSchema,
  produitCreateSchema,
  produitUpdateSchema,
  ajusterStockSchema,
  employeCreateSchema,
  employeUpdateSchema,
  depenseCreateSchema,
  payerSchema,
}