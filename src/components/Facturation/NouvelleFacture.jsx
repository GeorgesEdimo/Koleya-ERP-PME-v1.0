import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { Plus, Trash2, Save, ArrowLeft, UserPlus, GripVertical } from 'lucide-react'
import ClientFormModal from '../Clients/ClientFormModal'
import DocumentPreview from './DocumentPreview'
import { DOCUMENT_TYPES, TEMPLATES, DEVISES, getDocConfig, formatMontant } from './documentsConfig'

export default function NouvelleFacture() {
  const navigate = useNavigate()
  const { type: urlType } = useParams()
  const { state, dispatch } = useApp()

  const initialType = DOCUMENT_TYPES.find(d => d.type === urlType) ? urlType : 'facture'
  const [type, setType] = useState(initialType)
  const [mode, setMode] = useState('simple')
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [echeance, setEcheance] = useState('')
  const [devise, setDevise] = useState('XAF')
  const [template, setTemplate] = useState('classique-bleu')
  const [remiseGlobale, setRemiseGlobale] = useState(0)
  const [items, setItems] = useState([{ description: '', quantite: 1, prixUnitaire: 0, tauxTva: 0, remisePct: 0 }])
  const [notes, setNotes] = useState('')
  const [showClientModal, setShowClientModal] = useState(false)
  // Devis meta
  const [devisMeta, setDevisMeta] = useState({ modeCalcul: 'prix_unitaire', surface: '', taux: '', duree: '', nbIntervenants: '', mention: '', validiteJours: 30 })

  const isDevis = type === 'devis'
  const doc = getDocConfig(type)

  const client = state.clients.find(c => c.id === clientId)

  // Calculs
  const ligneHT = (it) => (it.quantite * it.prixUnitaire) * (1 - (it.remisePct || 0) / 100)
  const ligneTTC = (it) => ligneHT(it) * (1 + (it.tauxTva || 0) / 100)
  const totalHT = items.reduce((s, it) => s + ligneHT(it), 0)
  const totalTVA = items.reduce((s, it) => s + ligneHT(it) * ((it.tauxTva || 0) / 100), 0)
  const remiseMontant = totalHT * (remiseGlobale / 100)
  const totalTTC = totalHT - remiseMontant + totalTVA

  const addItem = () => setItems([...items, { description: '', quantite: 1, prixUnitaire: 0, tauxTva: 0, remisePct: 0 }])
  const removeItem = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)) }
  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const dragIndexRef = useRef(null)
  const handleDropOn = (targetIndex) => {
    const from = dragIndexRef.current
    if (from === null || from === undefined || from === targetIndex) { dragIndexRef.current = null; return }
    const newItems = [...items]
    const [moved] = newItems.splice(from, 1)
    newItems.splice(targetIndex, 0, moved)
    setItems(newItems)
    dragIndexRef.current = null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clientId || items.some(i => !i.description || i.prixUnitaire <= 0)) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    const payload = {
      clientId,
      clientNom: client.nom,
      type,
      statut: isDevis ? 'brouillon' : 'en_attente',
      date,
      echeance: echeance || date,
      items,
      total: totalTTC,
      totalHT,
      totalTVA,
      remiseGlobale,
      devise,
      template,
      paye: 0,
      reste: totalTTC,
      notes,
      ...(isDevis ? {
        modeCalcul: devisMeta.modeCalcul,
        surface: devisMeta.surface ? Number(devisMeta.surface) : null,
        taux: devisMeta.taux ? Number(devisMeta.taux) : null,
        duree: devisMeta.duree ? Number(devisMeta.duree) : null,
        nbIntervenants: devisMeta.nbIntervenants ? Number(devisMeta.nbIntervenants) : null,
        mention: devisMeta.mention,
        validiteJours: Number(devisMeta.validiteJours) || 30,
      } : {}),
    }

    const res = await dispatch({ type: 'ADD_FACTURE', payload })
    if (!res.ok) return
    navigate('/app/facturation')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Nouveau document</h1>
          <p className="page-subtitle">Remplissez les informations ci-dessous — aperçu en direct à droite</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type de document */}
            <div className="card p-5">
              <h3 className="text-base font-semibold text-dark-900 mb-3">Type de document</h3>
              <div className="flex flex-wrap gap-2">
                {DOCUMENT_TYPES.map((dt) => (
                  <button
                    key={dt.type}
                    type="button"
                    onClick={() => setType(dt.type)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      type === dt.type ? 'bg-primary-600 text-white border-primary-600' : 'border-dark-200 text-dark-600 hover:bg-dark-50'
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-dark-500">Mode :</span>
                <button type="button" onClick={() => setMode('simple')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'simple' ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600'}`}>Simple</button>
                <button type="button" onClick={() => setMode('avance')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'avance' ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600'}`}>Avancé</button>
              </div>
            </div>

            {/* Infos générales */}
            <div className="card p-5">
              <h3 className="text-base font-semibold text-dark-900 mb-4">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Client *</label>
                  <div className="flex gap-2">
                    <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="select flex-1" required>
                      <option value="">Sélectionner un client</option>
                      {state.clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowClientModal(true)} className="btn-secondary !px-3 flex-shrink-0" title="Ajouter un client">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="input-label">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
                </div>
                {doc.showExpiry ? (
                  <div>
                    <label className="input-label">Échéance</label>
                    <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} className="input" />
                  </div>
                ) : (
                  <div>
                    <label className="input-label">Devise</label>
                    <select value={devise} onChange={(e) => setDevise(e.target.value)} className="input select">
                      {DEVISES.map(dv => <option key={dv.code} value={dv.code}>{dv.label}</option>)}
                    </select>
                  </div>
                )}
                {doc.showExpiry && (
                  <div className="md:col-span-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Devise</label>
                      <select value={devise} onChange={(e) => setDevise(e.target.value)} className="input select">
                        {DEVISES.map(dv => <option key={dv.code} value={dv.code}>{dv.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Template</label>
                      <select value={template} onChange={(e) => setTemplate(e.target.value)} className="input select">
                        {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Remise globale (mode avancé) */}
              {mode === 'avance' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="input-label">Remise globale (%)</label>
                    <input type="number" value={remiseGlobale} onChange={(e) => setRemiseGlobale(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className="input" min="0" max="100" />
                  </div>
                  {!doc.showExpiry && (
                    <div>
                      <label className="input-label">Template</label>
                      <select value={template} onChange={(e) => setTemplate(e.target.value)} className="input select">
                        {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Devis meta */}
            {isDevis && (
              <div className="card p-5">
                <h3 className="text-base font-semibold text-dark-900 mb-4">Paramètres du devis</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="input-label">Mode de calcul</label>
                    <select value={devisMeta.modeCalcul} onChange={(e) => setDevisMeta({ ...devisMeta, modeCalcul: e.target.value })} className="input select">
                      <option value="prix_unitaire">Prix unitaire</option>
                      <option value="prix_m2">Prix au m²</option>
                      <option value="prix_heure">Prix à l'heure</option>
                      <option value="forfait">Forfait</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Surface (m²)</label>
                    <input type="number" value={devisMeta.surface} onChange={(e) => setDevisMeta({ ...devisMeta, surface: e.target.value })} className="input" min="0" />
                  </div>
                  <div>
                    <label className="input-label">Taux (%)</label>
                    <input type="number" value={devisMeta.taux} onChange={(e) => setDevisMeta({ ...devisMeta, taux: e.target.value })} className="input" min="0" />
                  </div>
                  <div>
                    <label className="input-label">Durée (jours)</label>
                    <input type="number" value={devisMeta.duree} onChange={(e) => setDevisMeta({ ...devisMeta, duree: e.target.value })} className="input" min="1" />
                  </div>
                  <div>
                    <label className="input-label">Nb intervenants</label>
                    <input type="number" value={devisMeta.nbIntervenants} onChange={(e) => setDevisMeta({ ...devisMeta, nbIntervenants: e.target.value })} className="input" min="1" />
                  </div>
                  <div>
                    <label className="input-label">Validité (jours)</label>
                    <input type="number" value={devisMeta.validiteJours} onChange={(e) => setDevisMeta({ ...devisMeta, validiteJours: e.target.value })} className="input" min="1" max="365" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="input-label">Mention spéciale</label>
                    <input type="text" value={devisMeta.mention} onChange={(e) => setDevisMeta({ ...devisMeta, mention: e.target.value })} className="input" placeholder="Acompte 30% à la commande, solde à la livraison..." />
                  </div>
                </div>
              </div>
            )}

            {/* Articles */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-dark-900">Articles</h3>
                <button type="button" onClick={addItem} className="btn-secondary text-sm">
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => (dragIndexRef.current = index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOn(index)}
                    className="flex items-center gap-2 p-3 bg-dark-50 rounded-xl cursor-grab active:cursor-grabbing flex-wrap"
                    title="Glisser pour réordonner"
                  >
                    <GripVertical className="w-4 h-4 text-dark-300 flex-shrink-0" />
                    <span className="text-sm font-medium text-dark-500 w-4">{index + 1}</span>
                    <input type="text" placeholder="Description" value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)} className="input flex-1 min-w-[140px]" required />
                    <input type="number" placeholder="Qté" value={item.quantite}
                      onChange={(e) => updateItem(index, 'quantite', parseInt(e.target.value) || 1)} className="input w-16" min="1" />
                    <input type="number" placeholder="Prix unitaire" value={item.prixUnitaire || ''}
                      onChange={(e) => updateItem(index, 'prixUnitaire', parseFloat(e.target.value) || 0)} className="input w-24" min="0" />
                    {mode === 'avance' && (
                      <>
                        <input type="number" placeholder="TVA %" value={item.tauxTva}
                          onChange={(e) => updateItem(index, 'tauxTva', Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className="input w-16" min="0" max="100" title="TVA (%)" />
                        <input type="number" placeholder="Remise %" value={item.remisePct}
                          onChange={(e) => updateItem(index, 'remisePct', Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className="input w-16" min="0" max="100" title="Remise (%)" />
                      </>
                    )}
                    <span className="text-sm font-semibold text-dark-900 w-28 text-right">{formatMontant(ligneTTC(item), devise)}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4 pt-4 border-t border-dark-200">
                <div className="text-right space-y-1">
                  <p className="text-sm text-dark-500">Total HT : <strong>{formatMontant(totalHT, devise)}</strong></p>
                  {totalTVA > 0 && <p className="text-sm text-dark-500">TVA : <strong>{formatMontant(totalTVA, devise)}</strong></p>}
                  {remiseGlobale > 0 && <p className="text-sm text-success-600">Remise ({remiseGlobale}%) : -{formatMontant(remiseMontant, devise)}</p>}
                  <p className="text-2xl font-bold text-dark-900 font-display">{formatMontant(totalTTC, devise)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card p-5">
              <label className="input-label">Notes (optionnelles)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[80px]" placeholder="Conditions de paiement, remarques..." />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Annuler</button>
              <button type="submit" className="btn-primary">
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          </form>
        </div>

        {/* Aperçu en direct */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 space-y-4">
            <p className="text-sm font-medium text-dark-700">Aperçu du document</p>
            <DocumentPreview
              entreprise={state.entreprise}
              client={client}
              numero={''}
              type={type}
              date={date}
              echeance={echeance || date}
              items={items}
              notes={notes}
              totalHT={totalHT}
              totalTTC={totalTTC}
              remiseGlobale={remiseGlobale}
              devise={devise}
              template={template}
            />
          </div>
        </div>
      </div>

      <ClientFormModal open={showClientModal} onClose={() => setShowClientModal(false)} onCreated={(clientCree) => setClientId(clientCree.id)} />
    </div>
  )
}
