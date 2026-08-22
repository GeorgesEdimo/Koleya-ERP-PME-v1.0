import React, { useState } from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { genererDocumentRH } from './pdfGeneratorRH'

const formatDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''

export default function AvenantContrat({ employe = {}, entreprise = {}, onClose }) {
  const [form, setForm] = useState({
    contrat_reference: '',
    date_effet: formatDateInput(new Date()),
    modification: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleGenerer = () => {
    genererDocumentRH('avenant_contrat', employe, entreprise, form)
  }

  const champ = (label, name, type = 'text', opts = {}) => (
    <div>
      <label className="input-label">{label}</label>
      <input type={type} name={name} value={form[name]} onChange={handleChange} className="input" {...opts} />
    </div>
  )

  const textarea = (label, name) => (
    <div className="md:col-span-2">
      <label className="input-label">{label}</label>
      <textarea name={name} value={form[name]} onChange={handleChange} className="input min-h-[100px]" rows={4} />
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-900">Avenant au contrat</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="border border-dark-200 rounded-xl p-4">
          <legend className="text-sm font-semibold text-primary-600 px-2">Détails de l'avenant</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {champ('Contrat de référence (n°)', 'contrat_reference', 'text', { placeholder: 'CONTR-2026-001', required: true })}
            {champ('Date d\'effet', 'date_effet', 'date', { required: true })}
          </div>
          {textarea('Modification apportée', 'modification')}
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