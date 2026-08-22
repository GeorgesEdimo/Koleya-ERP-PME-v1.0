import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef, useCallback, useState } from 'react'
import {
  clientsAPI, facturesAPI, creditsAPI, produitsAPI, employesAPI, depensesAPI, statsAPI,
} from '../utils/api'
import { useAuth } from './AuthContext'

const AppContext = createContext()

const initialState = {
  entreprise: null,
  parametres: null,
  clients: [],
  factures: [],
  credits: [],
  produits: [],
  employes: [],
  depenses: [],
}

// Les paramètres de facturation sont stockés sur la ligne entreprise (backend)
const mapParametres = (e) => e && ({
  devise: e.devise,
  tva: Number(e.tva || 0),
  prefixeFacture: e.prefixe_facture,
  prefixeDevis: e.prefixe_devis,
  delaiPaiement: e.delai_paiement,
})

// =============================================
// Transformations backend (snake_case) → état local (camelCase)
// et état local → payload API (camelCase → snake_case)
// =============================================
const mapClient = (c) => ({ id: c.id, nom: c.nom, telephone: c.telephone, email: c.email, adresse: c.adresse, solde: Number(c.solde || 0), creeLe: c.cree_le })
const mapFacture = (f) => ({
  id: f.id, numero: f.numero, clientId: f.client_id, clientNom: f.client_nom || f.clientNom,
  type: f.type, statut: f.statut, date: f.date, echeance: f.echeance,
  total: Number(f.total), totalHT: Number(f.total_ht ?? f.total ?? 0), totalTVA: Number(f.total_ttc - f.total_ht || 0),
  paye: Number(f.paye), reste: Number(f.reste), notes: f.notes,
  devise: f.devise || 'XAF', template: f.template_style || 'classique-bleu', remiseGlobale: Number(f.remise_globale || 0),
  devisMeta: f.devis_meta || null,
  items: (f.items || []).map((i) => ({ id: i.id, description: i.description, quantite: i.quantite, prixUnitaire: Number(i.prix_unitaire), total: Number(i.total), tauxTva: Number(i.taux_tva || 0), remisePct: Number(i.remise_pct || 0) })),
})
const mapCredit = (c) => ({
  id: c.id, clientId: c.client_id, clientNom: c.client_nom || c.clientNom,
  montantTotal: Number(c.montant_total), montantPaye: Number(c.montant_paye), reste: Number(c.reste),
  description: c.description, dateVente: c.date_vente, echeance: c.echeance, statut: c.statut,
  paiements: (c.paiements || []).map((p) => ({ id: p.id, date: p.date, montant: Number(p.montant), methode: p.methode })),
})
const mapProduit = (p) => ({
  id: p.id, nom: p.nom, reference: p.reference, categorie: p.categorie,
  stock: p.stock, stockMin: p.stock_min, prixAchat: Number(p.prix_achat), prixVente: Number(p.prix_vente), fournisseur: p.fournisseur,
})
const mapEmploye = (e) => ({ id: e.id, nom: e.nom, poste: e.poste, salaire: Number(e.salaire), dateEmbauche: e.date_embauche, telephone: e.telephone, statut: e.statut, conges: e.conges_jours })
const mapDepense = (d) => ({ id: d.id, categorie: d.categorie, description: d.description, montant: Number(d.montant), date: d.date })

const toClientAPI = (p) => ({ nom: p.nom, telephone: p.telephone, email: p.email, adresse: p.adresse })
const toFactureAPI = (p) => ({
  client_id: p.clientId, type: p.type || 'facture', date: p.date, echeance: p.echeance, notes: p.notes,
  remise_globale: p.remiseGlobale || 0, devise: p.devise || 'XAF', template_style: p.template || 'classique-bleu',
  mode_calcul: p.modeCalcul, surface: p.surface, taux: p.taux, duree: p.duree,
  nb_intervenants: p.nbIntervenants, mention: p.mention, validite_jours: p.validiteJours,
  items: (p.items || []).map((i) => ({
    description: i.description, quantite: i.quantite, prix_unitaire: i.prixUnitaire,
    taux_tva: i.tauxTva || 0, remise_pct: i.remisePct || 0,
  })),
})
const toCreditAPI = (p) => ({ client_id: p.clientId, montant_total: p.montantTotal, echeance: p.echeance, description: p.description })
const toProduitAPI = (p) => ({ nom: p.nom, reference: p.reference, categorie: p.categorie, stock: p.stock, stock_min: p.stockMin, prix_achat: p.prixAchat, prix_vente: p.prixVente, fournisseur: p.fournisseur })
const toEmployeAPI = (p) => ({ nom: p.nom, poste: p.poste, salaire: p.salaire, date_embauche: p.dateEmbauche, telephone: p.telephone })
const toDepenseAPI = (p) => ({ categorie: p.categorie, description: p.description, montant: p.montant, date: p.date })

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, ...action.payload }
    case 'SET_ENTREPRISE':
      return { ...state, entreprise: { ...state.entreprise, ...action.payload } }
    case 'SET_PARAMETRES':
      return { ...state, parametres: { ...state.parametres, ...action.payload } }
    case 'ADD_CLIENT': return { ...state, clients: [action.payload, ...state.clients] }
    case 'UPDATE_CLIENT': return { ...state, clients: state.clients.map((c) => (c.id === action.payload.id ? action.payload : c)) }
    case 'REMOVE_CLIENT': return { ...state, clients: state.clients.filter((c) => c.id !== action.payload) }
    case 'ADD_FACTURE': return { ...state, factures: [action.payload, ...state.factures] }
    case 'UPDATE_FACTURE': return { ...state, factures: state.factures.map((f) => (f.id === action.payload.id ? { ...f, ...action.payload } : f)) }
    case 'REMOVE_FACTURE': return { ...state, factures: state.factures.filter((f) => f.id !== action.payload) }
    case 'ADD_CREDIT': return { ...state, credits: [action.payload, ...state.credits] }
    case 'UPDATE_CREDIT': return { ...state, credits: state.credits.map((c) => (c.id === action.payload.id ? { ...c, ...action.payload } : c)) }
    case 'REMOVE_CREDIT': return { ...state, credits: state.credits.filter((c) => c.id !== action.payload) }
    case 'ADD_PRODUIT': return { ...state, produits: [action.payload, ...state.produits] }
    case 'UPDATE_PRODUIT': return { ...state, produits: state.produits.map((p) => (p.id === action.payload.id ? action.payload : p)) }
    case 'REMOVE_PRODUIT': return { ...state, produits: state.produits.filter((p) => p.id !== action.payload) }
    case 'ADD_EMPLOYE': return { ...state, employes: [action.payload, ...state.employes] }
    case 'UPDATE_EMPLOYE': return { ...state, employes: state.employes.map((e) => (e.id === action.payload.id ? action.payload : e)) }
    case 'REMOVE_EMPLOYE': return { ...state, employes: state.employes.filter((e) => e.id !== action.payload) }
    case 'ADD_DEPENSE': return { ...state, depenses: [action.payload, ...state.depenses] }
    case 'UPDATE_DEPENSE': return { ...state, depenses: state.depenses.map((d) => (d.id === action.payload.id ? action.payload : d)) }
    case 'REMOVE_DEPENSE': return { ...state, depenses: state.depenses.filter((d) => d.id !== action.payload) }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [state, dispatchReducer] = useReducer(reducer, initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Référence à jour de l'état (évite les fermetures obsolètes dans dispatch)
  const stateRef = useRef(state)
  stateRef.current = state

  // =============================================
  // Chargement initial des données (au login)
  // =============================================
  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [clients, facturesRes, credits, produits, employes, depenses, entreprise] = await Promise.all([
        clientsAPI.list(),
        facturesAPI.list({ limit: 1000 }),
        creditsAPI.list(),
        produitsAPI.list(),
        employesAPI.list(),
        depensesAPI.list(),
        statsAPI.entreprise(),
      ])
      dispatchReducer({
        type: 'SET_DATA',
        payload: {
          entreprise,
          parametres: mapParametres(entreprise),
          clients: clients.map(mapClient),
          factures: (facturesRes.factures || facturesRes || []).map(mapFacture),
          credits: credits.map(mapCredit),
          produits: produits.map(mapProduit),
          employes: employes.map(mapEmploye),
          depenses: depenses.map(mapDepense),
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) loadAll()
    else dispatchReducer({ type: 'SET_DATA', payload: initialState })
  }, [user, loadAll])

  // Efface le message d'erreur après quelques secondes
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(t)
  }, [error])

  // =============================================
  // dispatch async : appelle le backend puis met à jour l'état local
  // Retourne { ok, data?, error? } — les composants peuvent await si besoin.
  // =============================================
  const dispatch = useCallback(async (action) => {
    try {
      switch (action.type) {
        case 'SET_ENTREPRISE': {
          const e = await statsAPI.updateEntreprise(action.payload)
          dispatchReducer({ type: 'SET_ENTREPRISE', payload: e })
          return { ok: true, data: e }
        }
        case 'ADD_CLIENT': {
          const c = await clientsAPI.create(toClientAPI(action.payload))
          const mapped = mapClient(c)
          dispatchReducer({ type: 'ADD_CLIENT', payload: mapped })
          return { ok: true, data: mapped }
        }
        case 'UPDATE_CLIENT': {
          const { id, ...rest } = action.payload
          const c = await clientsAPI.update(id, toClientAPI(rest))
          dispatchReducer({ type: 'UPDATE_CLIENT', payload: mapClient(c) })
          return { ok: true }
        }
        case 'DELETE_CLIENT': {
          await clientsAPI.delete(action.payload)
          dispatchReducer({ type: 'REMOVE_CLIENT', payload: action.payload })
          return { ok: true }
        }
        case 'ADD_FACTURE': {
          const f = await facturesAPI.create(toFactureAPI(action.payload))
          const mapped = mapFacture(f)
          dispatchReducer({ type: 'ADD_FACTURE', payload: mapped })
          return { ok: true, data: mapped }
        }
        case 'UPDATE_FACTURE': {
          const { id, ...rest } = action.payload
          const f = await facturesAPI.update(id, rest)
          dispatchReducer({ type: 'UPDATE_FACTURE', payload: { ...mapFacture(f), ...rest } })
          return { ok: true }
        }
        case 'DELETE_FACTURE': {
          await facturesAPI.delete(action.payload)
          dispatchReducer({ type: 'REMOVE_FACTURE', payload: action.payload })
          return { ok: true }
        }
        case 'CONVERTIR_DEVIS': {
          const f = await facturesAPI.convertir(action.payload)
          const mapped = mapFacture(f)
          dispatchReducer({ type: 'ADD_FACTURE', payload: mapped })
          return { ok: true, data: mapped }
        }
        case 'PAYER_FACTURE': {
          const fac = stateRef.current.factures.find((f) => f.id === action.payload.id)
          if (!fac) return { ok: false, error: 'Facture introuvable' }
          const nouveauPaye = (fac.paye || 0) + action.payload.montant
          const nouveauStatut = nouveauPaye >= fac.total ? 'payee' : 'en_attente'
          const f = await facturesAPI.update(action.payload.id, { paye: nouveauPaye, statut: nouveauStatut })
          dispatchReducer({ type: 'UPDATE_FACTURE', payload: mapFacture(f) })
          return { ok: true }
        }
        case 'ADD_CREDIT': {
          const c = await creditsAPI.create(toCreditAPI(action.payload))
          dispatchReducer({ type: 'ADD_CREDIT', payload: mapCredit(c) })
          return { ok: true, data: c }
        }
        case 'PAYER_CREDIT': {
          const cred = stateRef.current.credits.find((c) => c.id === action.payload.id)
          if (!cred) return { ok: false, error: 'Crédit introuvable' }
          const res = await creditsAPI.payer(action.payload.id, { montant: action.payload.montant, methode: action.payload.methode })
          const nouveauPaye = (cred.montantPaye || 0) + action.payload.montant
          dispatchReducer({
            type: 'UPDATE_CREDIT',
            payload: { id: action.payload.id, montantPaye: nouveauPaye, reste: res.nouveauReste ?? cred.reste, statut: res.nouveauStatut },
          })
          return { ok: true }
        }
        case 'DELETE_CREDIT': {
          await creditsAPI.delete(action.payload)
          dispatchReducer({ type: 'REMOVE_CREDIT', payload: action.payload })
          return { ok: true }
        }
        case 'ADD_PRODUIT': {
          const p = await produitsAPI.create(toProduitAPI(action.payload))
          dispatchReducer({ type: 'ADD_PRODUIT', payload: mapProduit(p) })
          return { ok: true, data: p }
        }
        case 'UPDATE_PRODUIT': {
          const { id, ...rest } = action.payload
          const p = await produitsAPI.update(id, toProduitAPI(rest))
          dispatchReducer({ type: 'UPDATE_PRODUIT', payload: mapProduit(p) })
          return { ok: true }
        }
        case 'DELETE_PRODUIT': {
          await produitsAPI.delete(action.payload)
          dispatchReducer({ type: 'REMOVE_PRODUIT', payload: action.payload })
          return { ok: true }
        }
        case 'AJUSTER_STOCK': {
          const p = await produitsAPI.ajusterStock(action.payload.id, action.payload.quantite)
          dispatchReducer({ type: 'UPDATE_PRODUIT', payload: mapProduit(p) })
          return { ok: true }
        }
        case 'ADD_EMPLOYE': {
          const e = await employesAPI.create(toEmployeAPI(action.payload))
          dispatchReducer({ type: 'ADD_EMPLOYE', payload: mapEmploye(e) })
          return { ok: true, data: e }
        }
        case 'UPDATE_EMPLOYE': {
          const { id, ...rest } = action.payload
          const e = await employesAPI.update(id, toEmployeAPI(rest))
          dispatchReducer({ type: 'UPDATE_EMPLOYE', payload: mapEmploye(e) })
          return { ok: true }
        }
        case 'DELETE_EMPLOYE': {
          await employesAPI.delete(action.payload)
          dispatchReducer({ type: 'REMOVE_EMPLOYE', payload: action.payload })
          return { ok: true }
        }
        case 'ADD_DEPENSE': {
          const d = await depensesAPI.create(toDepenseAPI(action.payload))
          dispatchReducer({ type: 'ADD_DEPENSE', payload: mapDepense(d) })
          return { ok: true, data: d }
        }
        case 'UPDATE_DEPENSE': {
          const { id, ...rest } = action.payload
          const d = await depensesAPI.update(id, toDepenseAPI(rest))
          const mapped = mapDepense(d)
          dispatchReducer({ type: 'UPDATE_DEPENSE', payload: mapped })
          return { ok: true, data: mapped }
        }
        case 'DELETE_DEPENSE': {
          await depensesAPI.delete(action.payload)
          dispatchReducer({ type: 'REMOVE_DEPENSE', payload: action.payload })
          return { ok: true }
        }
        case 'SET_PARAMETRES': {
          const p = action.payload
          const e = await statsAPI.updateEntreprise({
            devise: p.devise,
            tva: p.tva,
            prefixe_facture: p.prefixeFacture,
            prefixe_devis: p.prefixeDevis,
            delai_paiement: p.delaiPaiement,
          })
          dispatchReducer({ type: 'SET_ENTREPRISE', payload: e })
          dispatchReducer({ type: 'SET_PARAMETRES', payload: mapParametres(e) })
          return { ok: true }
        }
        case 'RESET_DATA':
          dispatchReducer({ type: 'SET_DATA', payload: initialState })
          return { ok: true }
        default:
          return { ok: false, error: `Action inconnue : ${action.type}` }
      }
    } catch (err) {
      setError(err.message)
      return { ok: false, error: err.message }
    }
  }, [])

  // =============================================
  // Statistiques calculées localement (compatibles avec les composants)
  // =============================================
  const stats = useMemo(() => {
    const factures = state.factures || []
    const credits = state.credits || []
    const produits = state.produits || []
    const employes = state.employes || []
    const depenses = state.depenses || []
    return {
      chiffreAffaires: factures.filter((f) => f.type === 'facture').reduce((s, f) => s + (f.total || 0), 0),
      encaisse: factures.filter((f) => f.type === 'facture').reduce((s, f) => s + (f.paye || 0), 0),
      impaye: factures.filter((f) => f.type === 'facture').reduce((s, f) => s + (f.reste || 0), 0),
      nbFactures: factures.filter((f) => f.type === 'facture').length,
      nbDevis: factures.filter((f) => f.type === 'devis').length,
      creditsEnCours: credits.filter((c) => c.statut === 'en_cours' || c.statut === 'en_retard').reduce((s, c) => s + (c.reste || 0), 0),
      nbCreditsEnCours: credits.filter((c) => c.statut === 'en_cours' || c.statut === 'en_retard').length,
      valeurStock: produits.reduce((s, p) => s + (p.stock || 0) * (p.prixAchat || 0), 0),
      nbProduits: produits.length,
      alertesStock: produits.filter((p) => p.stock <= p.stockMin).length,
      nbEmployes: employes.filter((e) => e.statut === 'actif').length,
      masseSalariale: employes.filter((e) => e.statut === 'actif').reduce((s, e) => s + (e.salaire || 0), 0),
      totalDepenses: depenses.reduce((s, d) => s + (d.montant || 0), 0),
    }
  }, [state])

  const generateNumero = useCallback((type) => {
    const prefixes = { 'facture': 'FAC', 'facture_fiscale': 'FIS', 'facture_proforma': 'PRO', 'recu': 'REC', 'recu_vente': 'REV', 'recu_caisse': 'RCA', 'devis': 'DEV', 'note_credit': 'NDC', 'bon_commande': 'BCM', 'bon_livraison': 'BLV' }
    const prefixe = prefixes[type] || 'FAC'
    return `${prefixe}-${new Date().getFullYear()}-PROV`
  }, [])

  const value = {
    state,
    stats,
    dispatch,
    loading,
    error,
    generateNumero,
    refresh: loadAll,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      {/* Toast d'erreur (ex : quota d'essai atteint, abonnement expiré) */}
      {error && (
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl bg-danger-600 text-white px-4 py-3 text-sm shadow-lg">
          {error}
        </div>
      )}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
