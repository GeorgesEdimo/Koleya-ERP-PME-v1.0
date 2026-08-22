import React, { useState } from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { genererDocumentRH } from './pdfGeneratorRH'

const formatDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''
const diffJours = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)) + 1)

export default function DemandeConge({ employe = {}, entreprise = {}, onClose }) {
  const [form, setForm] = useState({
    type_conge: 'Congés payés',
    date_debut: formatDateInput(new Date()),
    date_fin: formatDateInput(new Date()),
    nb_jours: 1,
    solde_avant: '',
    solde_apres: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    let next = { ...form, [name]: value }
    if (name === 'date_debut' || name === 'date_fin') {
      if (next.date_debut && next.date_fin) {
        next.nb_jours = diffJours(next.date_debut, next.date_fin)
      }
    }
    setForm(next)
  }

  const handleGenerer = () => {
    genererDocumentRH('demande_conge', employe, entreprise, form)
  }

  const champ = (label, name, type = 'text', opts = {}) => (
    <div>
      <label className="input-label">{label}</label>
      <input type={type} name={name} value={form[name]} onChange={handleChange} className="input" {...opts} />
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-900">Demande de congé</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="border border-dark-200 rounded-xl p-4">
          <legend className="text-sm font-semibold text-primary-600 px-2">Détails du congé</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Type de congé</label>
              <select name="type_conge" value={form.type_conge} onChange={handleChange} className="input select">
                <option value="Congés payés">Congés payés</option>
                <option value="Congé maladie">Congé maladie</option>
                <option value="Congé maternité">Congé maternité</option>
                <option value="Congé sans solde">Congé sans solde</option>
                <option value="Jour de convenance">Jour de convenance</option>
              </select>
            </div>
            {champ('Nombre de jours', 'nb_jours', 'number', { min: 1 })}
            {champ('Date de début', 'date_debut', 'date', { required: true })}
            {champ('Date de fin', 'date_fin', 'date', { required: true })}
            {champ('Solde avant (jours)', 'solde_avant', 'number', { min: 0 })}
            {champ('Solde après (jours)', 'solde_apres', 'number', { min: 0 })}
          </div>
        </fieldset>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-200">
          <button type="button" onClick={onClose} className="btn-secondary">Fermer</button>
          <button type="button" onClick={handleGenerer} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Générer le PDF
          </button>
        </div>
      </form>
    </div>
  )
}