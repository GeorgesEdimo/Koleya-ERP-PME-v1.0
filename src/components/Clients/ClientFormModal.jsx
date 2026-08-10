import React, { useState, useEffect } from 'react'
import { X, UserPlus, Save } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useAbonnement } from '../../contexts/AbonnementContext'

// Modale réutilisable d'ajout / modification d'un client.
// Props : open, onClose, onCreated(client), initial (client à modifier ou null)
export default function ClientFormModal({ open, onClose, onCreated, initial = null }) {
  const { dispatch } = useApp()
  const { verrouQuota } = useAbonnement()
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', adresse: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { nom: initial.nom, telephone: initial.telephone || '', email: initial.email || '', adresse: initial.adresse || '' }
          : { nom: '', telephone: '', email: '', adresse: '' }
      )
    }
  }, [open, initial])

  if (!open) return null

  const isEdit = !!initial
  const verrou = verrouQuota('clients')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || !form.nom.trim()) return
    setSubmitting(true)
    const res = isEdit
      ? await dispatch({ type: 'UPDATE_CLIENT', payload: { id: initial.id, ...form } })
      : await dispatch({ type: 'ADD_CLIENT', payload: form })
    setSubmitting(false)
    if (res.ok) {
      setForm({ nom: '', telephone: '', email: '', adresse: '' })
      onCreated && onCreated(res.data)
      onClose && onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark-900">{isEdit ? 'Modifier le client' : 'Nouveau client'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEdit && verrou?.bloqué ? (
          <div className="p-6 text-sm text-danger-600 leading-relaxed">
            {verrou.raison === 'quota'
              ? `Quota d'essai atteint (${verrou.plafond} clients). Passez à un plan payant pour continuer.`
              : 'Abonnement expiré : l\'ajout de clients est désactivé. Choisissez un plan.'}
            <button onClick={onClose} className="btn-primary w-full mt-4 justify-center">Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="input-label">Nom *</label>
              <input className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Nom du client" required />
            </div>
            <div>
              <label className="input-label">Téléphone</label>
              <input className="input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+237 6XX XXX XXX" />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@entreprise.cm" />
            </div>
            <div>
              <label className="input-label">Adresse</label>
              <input className="input" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Quartier, ville" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {isEdit ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {submitting ? 'Enregistrement…' : isEdit ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}