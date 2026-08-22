import React, { useState } from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { genererDocumentRH, calculerPaie } from './pdfGeneratorRH'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(Math.round(n || 0)) + ' FCFA'

export default function BulletinPaie({ employe = {}, entreprise = {}, onClose }) {
  const [form, setForm] = useState({
    salaire_base: employe.salaire || employe.salaire_base || 0,
    primes: 0,
    heures_sup: 0,
    periode: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
  }

  const paie = calculerPaie(Number(form.salaire_base) || 0, { primes: Number(form.primes) || 0, heuresSup: Number(form.heures_sup) || 0 })

  const handleGenerer = () => {
    genererDocumentRH('bulletin_paie', employe, entreprise, form)
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
        <h2 className="text-xl font-bold text-dark-900">Bulletin de paie</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="border border-dark-200 rounded-xl p-4">
          <legend className="text-sm font-semibold text-primary-600 px-2">Éléments de paie (FCFA)</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {champ('Salaire de base', 'salaire_base')}
            {champ('Primes', 'primes')}
            {champ('Heures supp.', 'heures_sup')}
          </div>
          <div className="mt-4">
            <label className="input-label">Période</label>
            <input type="text" name="periode" value={form.periode} onChange={(e) => setForm(prev => ({ ...prev, periode: e.target.value }))} className="input" />
          </div>
        </fieldset>

        {/* Aperçu des calculs */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-dark-700 mb-3">Aperçu du calcul</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-dark-500">Salaire de base</span><span className="font-medium">{formatFCFA(paie.base)}</span></div>
            <div className="flex justify-between"><span className="text-dark-500">CNPS salariale (4,2%)</span><span className="text-danger-600">- {formatFCFA(paie.cnpsSalariale)}</span></div>
            <div className="flex justify-between"><span className="text-dark-500">CNPS patronale (8,65%)</span><span className="text-dark-600">{formatFCFA(paie.cnpsPatronale)}</span></div>
            <div className="flex justify-between"><span className="text-dark-500">IRPP (10% au-delà 200k)</span><span className="text-danger-600">- {formatFCFA(paie.irpp)}</span></div>
            <div className="flex justify-between"><span className="text-dark-500">CAC (2,5%)</span><span className="text-danger-600">- {formatFCFA(paie.cac)}</span></div>
            <div className="border-t border-dark-200 pt-2 flex justify-between"><span className="font-semibold">Net à payer</span><span className="font-bold text-success-600">{formatFCFA(paie.net)}</span></div>
          </div>
        </div>

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