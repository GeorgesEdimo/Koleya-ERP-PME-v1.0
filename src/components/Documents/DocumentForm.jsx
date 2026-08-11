import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  FileText, Receipt, ShoppingCart, Package, CreditCard,
  Plus, Trash2, X, Check, Edit3
} from 'lucide-react'
import { genererDocument } from '../../templates/templateEngine'

const DOCUMENT_TYPES = [
  { id: 'facture', label: 'Facture', icon: FileText, prefixe: 'FAC' },
  { id: 'facture_fiscale', label: 'Facture fiscale', icon: FileText, prefixe: 'FAC-F' },
  { id: 'facture_proforma', label: 'Facture proforma', icon: FileText, prefixe: 'FAC-P' },
  { id: 'recu', label: 'Recu', icon: Receipt, prefixe: 'REC' },
  { id: 'recu_vente', label: 'Recu de vente', icon: ShoppingCart, prefixe: 'RVE' },
  { id: 'recu_caisse', label: 'Recu de caisse', icon: Receipt, prefixe: 'RCA' },
  { id: 'devis', label: 'Devis', icon: FileText, prefixe: 'DEV' },
  { id: 'note_credit', label: 'Note de credit', icon: CreditCard, prefixe: 'NCR' },
  { id: 'bon_commande', label: 'Bon de commande', icon: Package, prefixe: 'BCO' },
  { id: 'bon_livraison', label: 'Bon de livraison', icon: Package, prefixe: 'BLV' },
]

const TEMPLATE_STYLES = [
  { id: 'classique-bleu', label: 'Classique Bleu', color: '#1B3A5C' },
  { id: 'classique-blanc', label: 'Classique Blanc', color: '#FFFFFF' },
  { id: 'moderne-rouge', label: 'Moderne Rouge', color: '#C0392B' },
  { id: 'mono-noir', label: 'Mono Noir', color: '#212529' },
  { id: 'orange-militaire', label: 'Orange Militaire', color: '#E67E22' },
  { id: 'bande-bleu', label: 'Bande Bleu', color: '#2980B9' },
]

const FIELDS_BY_TYPE = {
  facture: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, conditions: 'Paiement a 15 jours reception de la facture.' },
  facture_fiscale: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, conditions: 'Facture soumise a la TVA' },
  facture_proforma: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, conditions: 'Engagement valable 30 jours' },
  recu: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, conditions: '' },
  recu_vente: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, conditions: 'Payable comptant' },
  recu_caisse: { showExpiry: false, showCommande: false, showEnvoye: false, showTaxe: false, conditions: '' },
  devis: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, conditions: 'Offre valable 30 jours' },
  note_credit: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, conditions: '' },
  bon_commande: { showExpiry: false, showCommande: false, showEnvoye: true, showTaxe: true, conditions: '' },
  bon_livraison: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, conditions: '' },
}

export default function DocumentForm({ onGenerer, typeInitial = 'facture' }) {
  const { state } = useApp()
  const [docType, setDocType] = useState(typeInitial)
  const [templateStyle, setTemplateStyle] = useState('classique-bleu')
  const [mode, setMode] = useState('simple')

  const typeConfig = FIELDS_BY_TYPE[docType] || FIELDS_BY_TYPE.facture
  const typeInfo = DOCUMENT_TYPES.find(d => d.id === docType)

  const [form, setForm] = useState({
    entreprise_nom: state.entreprise?.nom || '',
    entreprise_adresse: state.entreprise?.adresse || '',
    destinataire_nom: '',
    destinataire_adresse: '',
    envoye_a: '',
    numero: '',
    date: new Date().toISOString().slice(0, 10),
    commande_numero: '',
    echeance: '',
    items: [{ designation: '', quantite: 1, prix_unitaire: 0, taxe: 0 }],
    conditions: typeConfig.conditions || '',
    notes: '',
  })

  const totalHT = form.items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0)
  const totalTaxes = form.items.reduce((s, i) => s + (i.quantite * i.prix_unitaire * (i.taxe || 0) / 100), 0)
  const totalTTC = totalHT + totalTaxes

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { designation: '', quantite: 1, prix_unitaire: 0, taxe: 0 }] })
  }

  const removeItem = (idx) => {
    if (form.items.length > 1) {
      setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
    }
  }

  const updateItem = (idx, field, value) => {
    const items = [...form.items]
    items[idx] = { ...items[idx], [field]: value }
    setForm({ ...form, items })
  }

  const handleGenerer = async () => {
    if (!form.destinataire_nom || form.items.some(i => !i.designation)) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    const numero = form.numero || `${typeInfo?.prefixe || 'DOC'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`
    const docData = {
      type: docType,
      template: templateStyle,
      ...form,
      totalHT,
      totalTaxes,
      totalTTC,
      numero,
    }
    await genererDocument(docData, state.entreprise)
    onGenerer(docData)
  }

  return (
    <div className="space-y-4">
      {/* Selection du type */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-dark-900 mb-3">Type de document</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DOCUMENT_TYPES.map(dt => (
            <button key={dt.id} onClick={() => { setDocType(dt.id); setForm({ ...form, conditions: FIELDS_BY_TYPE[dt.id]?.conditions || '' }) }}
              className={`p-3 rounded-xl border text-xs font-medium transition-all text-center ${
                docType === dt.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 hover:border-dark-300'
              }`}>
              <dt.icon className="w-5 h-5 mx-auto mb-1" />
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selection du template */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-dark-900 mb-3">Style du template</h3>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_STYLES.map(ts => (
            <button key={ts.id} onClick={() => setTemplateStyle(ts.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                templateStyle === ts.id ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-dark-50 hover:bg-dark-100'
              }`}>
              <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: ts.color }} />
              {ts.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <div className="card p-5">
        {/* Mode */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setMode('simple')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'simple' ? 'bg-primary-600 text-white' : 'bg-dark-100'}`}>Formulaire simple</button>
          <button onClick={() => setMode('avance')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'avance' ? 'bg-primary-600 text-white' : 'bg-dark-100'}`}>Formulaire avance</button>
        </div>

        {/* En-tete entreprise */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="input-label">De (entreprise)</label>
            <textarea value={`${form.entreprise_nom}\n${form.entreprise_adresse}`} onChange={e => {
              const lines = e.target.value.split('\n')
              setForm({ ...form, entreprise_nom: lines[0] || '', entreprise_adresse: lines.slice(1).join('\n') })
            }} className="input min-h-[60px] text-sm" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="input-label">Numero {typeInfo?.label || 'Document'}</label>
              <input type="text" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} className="input text-sm" placeholder={`${typeInfo?.prefixe || 'DOC'}-2026-001`} />
            </div>
            <div>
              <label className="input-label">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input text-sm" />
            </div>
          </div>
        </div>

        {/* Destinataire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="input-label">{docType === 'recu_caisse' ? 'Recu par' : docType === 'bon_commande' ? 'Vendeur' : docType === 'bon_livraison' ? 'Livraison de' : docType === 'recu_vente' ? 'Vendu a' : docType === 'recu' ? 'A' : 'Facture a'}</label>
            <textarea value={form.destinataire_adresse} onChange={e => setForm({ ...form, destinataire_adresse: e.target.value })} className="input min-h-[60px] text-sm" placeholder="Adresse du client" />
          </div>
          <div className="space-y-3">
            {typeConfig.showCommande && (
              <div>
                <label className="input-label">Commande n°</label>
                <input type="text" value={form.commande_numero} onChange={e => setForm({ ...form, commande_numero: e.target.value })} className="input text-sm" placeholder="Bon de commande (facultatif)" />
              </div>
            )}
            {typeConfig.showExpiry && (
              <div>
                <label className="input-label">Echeance</label>
                <input type="date" value={form.echeance} onChange={e => setForm({ ...form, echeance: e.target.value })} className="input text-sm" />
              </div>
            )}
          </div>
        </div>

        {/* Articles */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="input-label mb-0">Articles</label>
            <button type="button" onClick={addItem} className="btn-secondary text-xs py-1 px-2">
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          </div>
          {form.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2 p-2 bg-dark-50 rounded-lg">
              <span className="text-xs font-medium text-dark-500 w-5">{idx + 1}</span>
              <input type="text" placeholder="Designation" value={item.designation} onChange={e => updateItem(idx, 'designation', e.target.value)} className="input flex-1 text-xs" />
              <input type="number" placeholder="Qte" value={item.quantite} min="1" onChange={e => updateItem(idx, 'quantite', parseFloat(e.target.value) || 1)} className="input w-16 text-xs" />
              <input type="number" placeholder="Prix Unit." value={item.prix_unitaire || ''} min="0" onChange={e => updateItem(idx, 'prix_unitaire', parseFloat(e.target.value) || 0)} className="input w-24 text-xs" />
              {typeConfig.showTaxe && (
                <input type="number" placeholder="Taxe %" value={item.taxe || ''} min="0" max="100" onChange={e => updateItem(idx, 'taxe', parseFloat(e.target.value) || 0)} className="input w-16 text-xs" title="Taux de taxe en %" />
              )}
              <span className="text-xs font-semibold w-20 text-right">{formatFCFA(item.quantite * item.prix_unitaire * (1 + (item.taxe || 0) / 100))}</span>
              {form.items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded hover:bg-danger-50 text-danger-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="flex justify-end mb-4">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-dark-500">Total HT</span><span>{formatFCFA(totalHT)}</span></div>
            {totalTaxes > 0 && <div className="flex justify-between text-sm"><span className="text-dark-500">Taxes</span><span className="text-accent-600">{formatFCFA(totalTaxes)}</span></div>}
            <div className="flex justify-between font-bold text-lg border-t border-dark-200 pt-2"><span>TOTAL</span><span>{formatFCFA(totalTTC)}</span></div>
          </div>
        </div>

        {/* Conditions */}
        <div className="mb-4">
          <label className="input-label">Conditions et modalites de paiement</label>
          <textarea value={form.conditions} onChange={e => setForm({ ...form, conditions: e.target.value })} className="input min-h-[60px] text-sm" />
        </div>

        {/* Bouton generer */}
        <div className="flex justify-end">
          <button onClick={handleGenerer} className="btn-primary">
            <FileText className="w-4 h-4" />
            Generer le document
          </button>
        </div>
      </div>
    </div>
  )
}

function formatFCFA(n) {
  return new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'
}
