import React from 'react'
import { getDocConfig, TYPE_LABELS, DEST_LABELS, formatMontant, TEMPLATES } from './documentsConfig'

// Aperçu en direct du document (tous types) tel qu'il sera imprimé.
export default function DocumentPreview({ entreprise, client, numero, type = 'facture', date, echeance, items = [], notes = '', totalHT = 0, totalTTC = 0, remiseGlobale = 0, devise = 'XAF', template = 'classique-bleu' }) {
  const doc = getDocConfig(type)
  const label = TYPE_LABELS[type] || 'DOCUMENT'
  const destLabel = DEST_LABELS[type] || 'Facturer à'

  // Couleurs par template
  const ACCENTS = {
    'classique-bleu': '#1b3a5c',
    'classique-blanc': '#2d3748',
    'moderne-rouge': '#c0392b',
    'mono-noir': '#212529',
    'orange-militaire': '#d35400',
    'bande-bleu': '#2980b9',
  }
  const accent = ACCENTS[template] || '#1b3a5c'

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
          <p className="text-xs text-dark-400 uppercase tracking-wide mb-0.5">{destLabel}</p>
          <p className="font-semibold text-dark-900">{client?.nom || '—'}</p>
          {client?.adresse && <p className="text-dark-500">{client.adresse}</p>}
          {client?.telephone && <p className="text-dark-500">{client.telephone}</p>}
        </div>
        <div className="text-right space-y-1 text-dark-600">
          <p><span className="text-dark-400">Date : </span>{date ? new Date(date).toLocaleDateString('fr-FR') : '—'}</p>
          {(doc.showExpiry && echeance) && (
            <p><span className="text-dark-400">Échéance : </span>{new Date(echeance).toLocaleDateString('fr-FR')}</p>
          )}
          <p><span className="text-dark-400">Devise : </span>{devise}</p>
        </div>
      </div>

      {/* Articles */}
      <div className="px-6 pb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 text-left" style={{ color: accent }}>
              <th className="py-2 font-semibold">Description</th>
              <th className="py-2 font-semibold text-center w-12">Qté</th>
              <th className="py-2 font-semibold text-right w-28">Prix</th>
              <th className="py-2 font-semibold text-right w-20">TVA</th>
              <th className="py-2 font-semibold text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center text-dark-400 text-xs">Aucun article ajouté</td>
              </tr>
            ) : (
              items.map((it, i) => {
                const ht = (it.quantite || 0) * (it.prixUnitaire || 0)
                const remise = ht * ((it.remisePct || 0) / 100)
                const htR = ht - remise
                const tva = htR * ((it.tauxTva || 0) / 100)
                const ttc = htR + tva
                return (
                  <tr key={i} className="border-b border-dark-100">
                    <td className="py-2 text-dark-800">
                      {it.description || '—'}
                      {(it.remisePct > 0) && <span className="ml-2 text-xs text-success-600">-{it.remisePct}%</span>}
                    </td>
                    <td className="py-2 text-center">{it.quantite}</td>
                    <td className="py-2 text-right">{formatMontant(it.prixUnitaire, devise)}</td>
                    <td className="py-2 text-right">{it.tauxTva || 0}%</td>
                    <td className="py-2 text-right font-medium">{formatMontant(ttc, devise)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Notes + total */}
      <div className="px-6 py-5 flex flex-col sm:flex-row justify-between items-end gap-3">
        <p className="text-xs text-dark-500 italic flex-1 whitespace-pre-wrap">{notes}</p>
        <div className="text-right space-y-1">
          {remiseGlobale > 0 && (
            <p className="text-sm text-dark-500">Remise ({remiseGlobale}%) : <span className="text-success-600">-{formatMontant(totalHT * (remiseGlobale / 100), devise)}</span></p>
          )}
          <p className="text-sm text-dark-500">Total HT : {formatMontant(totalHT, devise)}</p>
          <p className="text-2xl font-bold font-display" style={{ color: accent }}>{formatMontant(totalTTC, devise)}</p>
        </div>
      </div>

      {/* Template badge */}
      <div className="px-6 pb-4">
        <span className="text-xs text-dark-400">Template : {(TEMPLATES.find(t => t.id === template) || TEMPLATES[0]).label}</span>
      </div>
    </div>
  )
}
