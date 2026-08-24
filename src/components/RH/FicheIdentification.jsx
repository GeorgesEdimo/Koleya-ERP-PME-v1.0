import React, { useState } from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { genererDocumentRH } from './pdfGeneratorRH'

const formatDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''

export default function FicheIdentification({ employe = {}, entreprise = {}, onClose }) {
  const [form, setForm] = useState({
    // Identité
    civilite: employe.civilite || '',
    prenom: employe.prenom || '',
    nom: employe.nom || '',
    nom_usage: employe.nom_usage || '',
    date_naissance: formatDateInput(employe.date_naissance),
    lieu_naissance: employe.lieu_naissance || '',
    nationalite: employe.nationalite || 'Camerounaise',
    matricule: employe.matricule || '',
    // Situation familiale
    situation_familiale: employe.situation_familiale || 'celibataire',
    nb_enfants: employe.nb_enfants || 0,
    num_secu: employe.num_secu || '',
    iban: employe.iban || '',
    bic: employe.bic || '',
    // Contact
    adresse: employe.adresse || '',
    telephone: employe.telephone || '',
    email: employe.email || '',
    email_pro: employe.email_pro || '',
    telephone_pro: employe.telephone_pro || '',
    // Urgence
    contact_urgence: employe.contact_urgence || '',
    lien_parente: employe.lien_parente || '',
    tel_urgence: employe.tel_urgence || '',
    // Situation pro
    poste: employe.poste || '',
    manager_n1: employe.manager_n1 || '',
    site_travail: employe.site_travail || '',
    date_embauche: formatDateInput(employe.date_embauche),
  })

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }))
  }

  const handleGenerer = () => {
    genererDocumentRH('fiche_identification', employe, entreprise, form)
  }

  const section = (titre, enfants) => (
    <fieldset className="border border-dark-200 rounded-xl p-4 mb-4">
      <legend className="text-sm font-semibold text-primary-600 px-2">{titre}</legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{enfants}</div>
    </fieldset>
  )

  const champ = (label, name, type = 'text', opts = {}) => (
    <div>
      <label className="input-label">{label}</label>
      <input type={type} name={name} value={form[name]} onChange={handleChange} className="input" {...opts} />
    </div>
  )

  const select = (label, name, options) => (
    <div>
      <label className="input-label">{label}</label>
      <select name={name} value={form[name]} onChange={handleChange} className="input select">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  const textarea = (label, name) => (
    <div className="md:col-span-2">
      <label className="input-label">{label}</label>
      <textarea name={name} value={form[name]} onChange={handleChange} className="input min-h-[80px]" rows={3} />
    </div>
  )

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-900">Fiche d’identification</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500" title="Fermer">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {section('Identité', [
          champ('Civilité', 'civilite', 'text', { placeholder: 'M./Mme' }),
          champ('Prénom', 'prenom', 'text', { placeholder: 'Jean' }),
          champ('Nom', 'nom', 'text', { placeholder: 'Dupont', required: true }),
          champ('Nom d\'usage', 'nom_usage', 'text', { placeholder: 'Épouse Martin' }),
          champ('Date de naissance', 'date_naissance', 'date'),
          champ('Lieu de naissance', 'lieu_naissance', 'text', { placeholder: 'Douala' }),
          champ('Nationalité', 'nationalite', 'text', { placeholder: 'Camerounaise' }),
          champ('Matricule', 'matricule', 'text', { placeholder: 'EMP-001' }),
        ])}

        {section('Situation familiale', [
          select('Situation', 'situation_familiale', [
            { value: 'celibataire', label: 'Célibataire' },
            { value: 'marie', label: 'Marié(e)' },
            { value: 'divorce', label: 'Divorcé(e)' },
            { value: 'veuf', label: 'Veuf/Veuve' },
          ]),
          champ('Nb d\'enfants', 'nb_enfants', 'number', { min: 0 }),
          champ('N° Sécurité sociale', 'num_secu', 'text', { placeholder: '123456789' }),
          champ('IBAN', 'iban', 'text', { placeholder: 'CM21 1000...' }),
          champ('BIC', 'bic', 'text', { placeholder: 'BANKCMCM' }),
        ])}

        {section('Coordonnées', [
          textarea('Adresse', 'adresse'),
          champ('Téléphone', 'telephone', 'tel', { placeholder: '+237 6XX XXX XXX' }),
          champ('Email', 'email', 'email', { placeholder: 'perso@email.com' }),
          champ('Email pro', 'email_pro', 'email', { placeholder: 'prenom.nom@entreprise.com' }),
          champ('Téléphone pro', 'telephone_pro', 'tel', { placeholder: '+237 2XX XX XX XX' }),
        ])}

        {section('Contact d\'urgence', [
          champ('Nom du contact', 'contact_urgence', 'text', { placeholder: 'Marie Dupont' }),
          champ('Lien de parenté', 'lien_parente', 'text', { placeholder: 'Conjoint(e)' }),
          champ('Tél. urgence', 'tel_urgence', 'tel', { placeholder: '+237 6XX XXX XXX' }),
        ])}

        {section('Situation professionnelle', [
          champ('Poste', 'poste', 'text', { placeholder: 'Développeur' }),
          champ('Manager N+1', 'manager_n1', 'text', { placeholder: 'Jean Martin' }),
          champ('Site de travail', 'site_travail', 'text', { placeholder: 'Siège Douala' }),
          champ('Date d\'embauche', 'date_embauche', 'date'),
        ])}

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