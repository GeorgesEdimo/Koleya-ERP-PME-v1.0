import React, { useState } from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { genererDocumentRH } from './pdfGeneratorRH'

export default function EntretienAnnuel({ employe = {}, entreprise = {}, onClose }) {
  const [form, setForm] = useState({
    periode: new Date().getFullYear().toString(),
    bilan: '',
    objectifs: '',
    formations: '',
    commentaires: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleGenerer = () => {
    genererDocumentRH('entretien_annuel', employe, entreprise, form)
  }

  const textarea = (label, name) => (
    <div>
      <label className="input-label">{label}</label>
      <textarea name={name} value={form[name]} onChange={handleChange} className="input min-h-[90px]" rows={3} />
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-900">Compte-rendu d’entretien annuel</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="border border-dark-200 rounded-xl p-4">
          <legend className="text-sm font-semibold text-primary-600 px-2">Entretien</legend>
          <div>
            <label className="input-label">Période (année)</label>
            <input type="number" name="periode" value={form.periode} onChange={handleChange} className="input" min="2020" />
          </div>
          {textarea('Bilan de l\'année', 'bilan')}
          {textarea('Objectifs', 'objectifs')}
          {textarea('Formations', 'formations')}
          {textarea('Commentaires', 'commentaires')}
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