import React from 'react'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

// Aperçu en direct du document (facture / devis) tel qu'il sera imprimé.
export default function DocumentPreview({ entreprise, client, numero, type, date, echeance, items = [], notes = '', total = 0 }) {
  const label = type === 'devis' ? 'Devis' : 'Facture'
  const accent = '#1b3a5c'

  return (
    <div className="card overflow-hidden shadow-md">
      {/* Bandeau entreprise */}
      <div className="px-6 py-5 text-white flex items-start justify-between" style={{ background: accent }}>
        <div>
          {entreprise?.logo && (
            <img src={entreprise.logo} alt="logo" className="h-12 w-12 object-contain bg-white rounded p-1 mb-1" />
          )}
          <p className="font-bold text-lg font-display">{entreprise?.nom || 'Koleya'}</p>
          {entreprise?.adresse && <p className="text-xs text-white/70">{entreprise.adresse}</p>}
          {entreprise?.telephone && <p className="text-xs text-white/70">{entreprise.telephone}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold uppercase tracking-wide">{label}</p>
          <p className="text-sm text-white/80">{numero || 'N° automatique'}</p>
        </div>
      </div>

      {/* Infos client / dates */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-dark-400 uppercase tracking-wide mb-0.5">Facturer à</p>
          <p className="font-semibold text-dark-900">{client?.nom || '—'}</p>
          {client?.adresse && <p className="text-dark-500">{client.adresse}</p>}
          {client?.telephone && <p className="text-dark-500">{client.telephone}</p>}
        </div>
        <div className="text-right space-y-1 text-dark-600">
          <p><span className="text-dark-400">Date : </span>{date ? new Date(date).toLocaleDateString('fr-FR') : '—'}</p>
          <p><span className="text-dark-400">Échéance : </span>{echeance ? new Date(echeance).toLocaleDateString('fr-FR') : '—'}</p>
        </div>
      </div>

      {/* Articles */}
      <div className="px-6 pb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 text-[#1b3a5c] text-left">
              <th className="py-2 font-semibold">Description</th>
              <th className="py-2 font-semibold text-center w-12">Qté</th>
              <th className="py-2 font-semibold text-right w-28">Prix</th>
              <th className="py-2 font-semibold text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-4 text-center text-dark-400 text-xs">Aucun article ajouté</td>
              </tr>
            ) : (
              items.map((it, i) => (
                <tr key={i} className="border-b border-dark-100">
                  <td className="py-2 text-dark-800">{it.description || '—'}</td>
                  <td className="py-2 text-center">{it.quantite}</td>
                  <td className="py-2 text-right">{formatFCFA(it.prixUnitaire)}</td>
                  <td className="py-2 text-right font-medium">{formatFCFA(it.quantite * it.prixUnitaire)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Notes + total */}
      <div className="px-6 py-5 flex flex-col sm:flex-row justify-between items-end gap-3">
        <p className="text-xs text-dark-500 italic flex-1 whitespace-pre-wrap">{notes}</p>
        <div className="text-right">
          <p className="text-sm text-dark-500">Total</p>
          <p className="text-2xl font-bold font-display" style={{ color: accent }}>{formatFCFA(total)}</p>
        </div>
      </div>
    </div>
  )
}