import React, { useState } from 'react'
import { Download, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { genererDocumentRH } from './pdfGeneratorRH'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(Math.round(n || 0)) + ' FCFA'

export default function NoteFrais({ employe = {}, entreprise = {}, onClose }) {
  const [form, setForm] = useState({
    date_soumission: new Date().toISOString().slice(0, 10),
    lignes: [{ date_frais: new Date().toISOString().slice(0, 10), categorie: '', description: '', montant: '' }],
  })

  const total = form.lignes.reduce((s, l) => s + (parseInt(l.montant) || 0), 0)

  const updateLigne = (index, champ, value) => {
    const newLignes = [...form.lignes]
    newLignes[index] = { ...newLignes[index], [champ]: value }
    setForm(prev => ({ ...prev, lignes: newLignes }))
  }

  const addLigne = () => setForm(prev => ({
    ...prev,
    lignes: [...prev.lignes, { date_frais: new Date().toISOString().slice(0, 10), categorie: '', description: '', montant: '' }],
  }))

  const removeLigne = (index) => {
    if (form.lignes.length > 1) {
      setForm(prev => ({ ...prev, lignes: prev.lignes.filter((_, i) => i !== index) }))
    }
  }

  const handleGenerer = () => {
    genererDocumentRH('note_frais', employe, entreprise, form)
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-900">Note de frais</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="border border-dark-200 rounded-xl p-4">
          <legend className="text-sm font-semibold text-primary-600 px-2">Note de frais</legend>
          <div>
            <label className="input-label">Date de soumission</label>
            <input type="date" value={form.date_soumission} onChange={(e) => setForm(prev => ({ ...prev, date_soumission: e.target.value }))} className="input" />
          </div>

          <div className="flex items-center justify-between mt-4 mb-2">
            <h3 className="text-sm font-semibold text-dark-700">Lignes de frais</h3>
            <button type="button" onClick={addLigne} className="btn-secondary text-xs">
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {form.lignes.map((ligne, index) => (
              <div key={index} className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center p-3 bg-dark-50 rounded-xl">
                <input type="date" value={ligne.date_frais} onChange={(e) => updateLigne(index, 'date_frais', e.target.value)} className="input md:col-span-3" />
                <input type="text" placeholder="Catégorie" value={ligne.categorie} onChange={(e) => updateLigne(index, 'categorie', e.target.value)} className="input md:col-span-3" />
                <input type="text" placeholder="Description" value={ligne.description} onChange={(e) => updateLigne(index, 'description', e.target.value)} className="input md:col-span-3" />
                <div className="flex items-center gap-2 md:col-span-3">
                  <input type="number" placeholder="Montant" value={ligne.montant} onChange={(e) => updateLigne(index, 'montant', e.target.value)} className="input flex-1" min="0" />
                  {form.lignes.length > 1 && (
                    <button type="button" onClick={() => removeLigne(index)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-dark-200 flex items-center justify-between">
            <span className="font-semibold text-dark-700">Total</span>
            <span className="text-xl font-bold text-success-600">{formatFCFA(total)}</span>
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