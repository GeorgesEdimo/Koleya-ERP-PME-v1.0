import React, { useState } from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { genererDocumentRH } from './pdfGeneratorRH'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(Math.round(n || 0)) + ' FCFA'

export default function SoldeToutCompte({ employe = {}, entreprise = {}, onClose }) {
  const [form, setForm] = useState({
    salaire_prorata: employe.salaire || 0,
    indemnite_conges: 0,
    indemnite_rupture: 0,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
  }

  const total = (Number(form.salaire_prorata) || 0) + (Number(form.indemnite_conges) || 0) + (Number(form.indemnite_rupture) || 0)

  const handleGenerer = () => {
    genererDocumentRH('solde_tout_compte', employe, entreprise, form)
  }

  const champ = (label, name) => (
    <div>
      <label className="input-label">{label}</label>
      <input type="number" name={name} value={form[name]} onChange={handleChange} className="input" min="0" />
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-900">Solde de tout compte</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="border border-dark-200 rounded-xl p-4">
          <legend className="text-sm font-semibold text-primary-600 px-2">Montants (FCFA)</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {champ('Salaire prorata', 'salaire_prorata')}
            {champ('Indemnités congés', 'indemnite_conges')}
            {champ('Indemnité rupture', 'indemnite_rupture')}
          </div>
          <div className="mt-4 pt-4 border-t border-dark-200 flex items-center justify-between">
            <span className="font-semibold text-dark-700">Total net</span>
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