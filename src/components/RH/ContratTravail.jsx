import React, { useState } from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { genererDocumentRH } from './pdfGeneratorRH'

const formatDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''

export default function ContratTravail({ employe = {}, entreprise = {}, onClose }) {
  const [form, setForm] = useState({
    type_contrat: 'CDI',
    poste: employe.poste || '',
    date_debut: formatDateInput(employe.date_embauche || new Date()),
    date_fin: formatDateInput(employe.date_fin),
    salaire_base: employe.salaire || employe.salaire_base || '',
    heures_semaine: employe.heures_semaine || 40,
    statut_cadre: employe.statut_cadre === true,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value) }))
  }

  const handleGenerer = () => {
    genererDocumentRH('contrat_travail', employe, entreprise, form)
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
        <h2 className="text-xl font-bold text-dark-900">Contrat de travail</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="border border-dark-200 rounded-xl p-4">
          <legend className="text-sm font-semibold text-primary-600 px-2">Détails du contrat</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Type de contrat</label>
              <select name="type_contrat" value={form.type_contrat} onChange={handleChange} className="input select">
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">Stage</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>
            {champ('Poste', 'poste', 'text', { placeholder: 'Développeur Fullstack' })}
            {champ('Date de début', 'date_debut', 'date', { required: true })}
            {champ('Date de fin (si CDD)', 'date_fin', 'date')}
            {champ('Salaire de base (FCFA)', 'salaire_base', 'number', { min: 0, required: true })}
            {champ('Heures / semaine', 'heures_semaine', 'number', { min: 0, max: 60 })}
            <div className="flex items-center gap-2">
              <input type="checkbox" name="statut_cadre" id="statut_cadre" checked={form.statut_cadre} onChange={handleChange} className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="statut_cadre" className="text-sm text-dark-700">Statut cadre</label>
            </div>
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