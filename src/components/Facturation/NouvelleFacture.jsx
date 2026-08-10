import React, { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { Plus, Trash2, Save, ArrowLeft, UserPlus, GripVertical } from 'lucide-react'
import { generateInvoicePDF } from './pdfGenerator'
import ClientFormModal from '../Clients/ClientFormModal'
import DocumentPreview from './DocumentPreview'

export default function NouvelleFacture() {
  const navigate = useNavigate()
  const { type: urlType } = useParams()
  const { state, dispatch, generateNumero } = useApp()

  const [type, setType] = useState(urlType === 'devis' ? 'devis' : 'facture')
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [echeance, setEcheance] = useState('')
  const [items, setItems] = useState([{ description: '', quantite: 1, prixUnitaire: 0 }])
  const [notes, setNotes] = useState('')
  const [showClientModal, setShowClientModal] = useState(false)

  // Les IDs de clients sont des UUID (backend) — comparaison directe, pas de parseInt
  const client = state.clients.find(c => c.id === clientId)

  const total = items.reduce((sum, item) => sum + (item.quantite * item.prixUnitaire), 0)

  const addItem = () => {
    setItems([...items, { description: '', quantite: 1, prixUnitaire: 0 }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  // Drag & drop : réordonner les articles à la souris
  const dragIndexRef = useRef(null)
  const handleDropOn = (targetIndex) => {
    const from = dragIndexRef.current
    if (from === null || from === undefined || from === targetIndex) {
      dragIndexRef.current = null
      return
    }
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

    const numero = generateNumero(type)
    const facture = {
      numero,
      clientId,
      clientNom: client.nom,
      type,
      statut: type === 'devis' ? 'brouillon' : 'en_attente',
      date,
      echeance: echeance || date,
      items,
      total,
      paye: 0,
      reste: total,
      notes,
    }

    const res = await dispatch({ type: 'ADD_FACTURE', payload: facture })
    if (!res.ok) return // erreur (ex : quota) affichée par le toast

    // Le numéro est généré par le backend (generer_numero)
    const factureCreee = res.data || facture

    if (confirm(`${type === 'devis' ? 'Devis' : 'Facture'} créée ! Voulez-vous générer le PDF ?`)) {
      await generateInvoicePDF(factureCreee, state.entreprise)
    }

    navigate('/app/facturation')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">
            {type === 'devis' ? 'Nouveau devis' : 'Nouvelle facture'}
          </h1>
          <p className="page-subtitle">Remplissez les informations ci-dessous — aperçu en direct à droite</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type toggle */}
        <div className="card p-5">
          <div className="flex items-center gap-2 bg-dark-100 rounded-xl p-1 w-fit">
            <button
              type="button"
              onClick={() => setType('facture')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                type === 'facture' ? 'bg-primary-600 text-white shadow' : 'text-dark-600 hover:bg-white'
              }`}
            >
              Facture
            </button>
            <button
              type="button"
              onClick={() => setType('devis')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                type === 'devis' ? 'bg-primary-600 text-white shadow' : 'text-dark-600 hover:bg-white'
              }`}
            >
              Devis
            </button>
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
                  {state.clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="btn-secondary !px-3 flex-shrink-0"
                  title="Ajouter un client"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="input-label">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="input-label">Échéance</label>
              <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-dark-900">Articles</h3>
            <button type="button" onClick={addItem} className="btn-secondary text-sm">
              <Plus className="w-4 h-4" />
              Ajouter
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
                className="flex items-center gap-3 p-3 bg-dark-50 rounded-xl cursor-grab active:cursor-grabbing"
                title="Glisser pour réordonner"
              >
                <GripVertical className="w-4 h-4 text-dark-300 flex-shrink-0" />
                <span className="text-sm font-medium text-dark-500 w-5">{index + 1}</span>
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="input flex-1"
                  required
                />
                <input
                  type="number"
                  placeholder="Qté"
                  value={item.quantite}
                  onChange={(e) => updateItem(index, 'quantite', parseInt(e.target.value) || 1)}
                  className="input w-20"
                  min="1"
                />
                <input
                  type="number"
                  placeholder="Prix unitaire"
                  value={item.prixUnitaire || ''}
                  onChange={(e) => updateItem(index, 'prixUnitaire', parseInt(e.target.value) || 0)}
                  className="input w-32"
                  min="0"
                />
                <span className="text-sm font-semibold text-dark-900 w-28 text-right">
                  {new Intl.NumberFormat('fr-CM').format(item.quantite * item.prixUnitaire)} FCFA
                </span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end mt-4 pt-4 border-t border-dark-200">
            <div className="text-right">
              <p className="text-sm text-dark-500">Total</p>
              <p className="text-2xl font-bold text-dark-900 font-display">
                {new Intl.NumberFormat('fr-CM').format(total)} FCFA
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <label className="input-label">Notes (optionnelles)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[80px]"
            placeholder="Conditions de paiement, remarques..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            <Save className="w-4 h-4" />
            Enregistrer {type === 'devis' ? 'le devis' : 'la facture'}
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
              numero={generateNumero(type)}
              type={type}
              date={date}
              echeance={echeance || date}
              items={items}
              notes={notes}
              total={total}
            />
          </div>
        </div>
      </div>

      {/* Modale d'ajout de client */}
      <ClientFormModal
        open={showClientModal}
        onClose={() => setShowClientModal(false)}
        onCreated={(clientCree) => setClientId(clientCree.id)}
      />
    </div>
  )
}
