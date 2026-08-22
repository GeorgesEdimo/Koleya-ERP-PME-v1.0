import React, { useState } from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { genererDocumentRH } from './pdfGeneratorRH'

const formatDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''

export default function VisiteMedicale({ employe = {}, entreprise = {}, onClose }) {
  const [form, setForm] = useState({
    date_visite: formatDateInput(new Date()),
    centre_medical: '',
    medecin: '',
    aptitude: 'Apte',
    restrictions: '',
    prochaine_visite: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleGenerer = () => {
    genererDocumentRH('visite_medicale', employe, entreprise, form)
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
        <h2 className="text-xl font-bold text-dark-900">Visite médicale</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="border border-dark-200 rounded-xl p-4">
          <legend className="text-sm font-semibold text-primary-600 px-2">Détails de la visite</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {champ('Date de visite', 'date_visite', 'date', { required: true })}
            <div>
              <label className="input-label">Aptitude</label>
              <select name="aptitude" value={form.aptitude} onChange={handleChange} className="input select">
                <option value="Apte">Apte</option>
                <option value="Apte avec restrictions">Apte avec restrictions</option>
                <option value="Inapte temporairement">Inapte temporairement</option>
                <option value="Inapte définitivement">Inapte définitivement</option>
              </select>
            </div>
            {champ('Centre médical', 'centre_medical', 'text', { placeholder: 'Clinique des Gestions' })}
            {champ('Médecin', 'medecin', 'text', { placeholder: 'Dr. Martin' })}
            {champ('Prochaine visite', 'prochaine_visite', 'date')}
          </div>
          <div className="mt-4">
            <label className="input-label">Restrictions éventuelles</label>
            <textarea name="restrictions" value={form.restrictions} onChange={handleChange} className="input min-h-[80px]" rows={3} placeholder="Port de charges lourdes limité à 15 kg, etc." />
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