import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useAbonnement } from '../../contexts/AbonnementContext'
import {
  Plus, Users, Edit3, Trash2, Download, Calculator,
  Calendar, Briefcase, DollarSign, TrendingUp, FileText, X
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { generateTablePDF } from '../Facturation/pdfGenerator'

import FicheIdentification from './FicheIdentification'
import ContratTravail from './ContratTravail'
import AvenantContrat from './AvenantContrat'
import AttestationTravail from './AttestationTravail'
import CertificatTravail from './CertificatTravail'
import SoldeToutCompte from './SoldeToutCompte'
import BulletinPaie from './BulletinPaie'
import OrdreMission from './OrdreMission'
import NoteFrais from './NoteFrais'
import DemandeConge from './DemandeConge'
import EntretienAnnuel from './EntretienAnnuel'
import FicheOnboarding from './FicheOnboarding'
import VisiteMedicale from './VisiteMedicale'
import RecuMateriel from './RecuMateriel'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n || 0) + ' FCFA'

function calculerSalaireNet(salaireBrut) {
  const cnps = Math.round(salaireBrut * 0.042)
  const irpp = salaireBrut > 200000 ? Math.round((salaireBrut - 200000) * 0.10) : 0
  const net = salaireBrut - cnps - irpp
  return { cnps, irpp, net }
}

const DOCUMENTS_RH = [
  { type: 'fiche_identification', label: 'Fiche d\'identification', icon: Users, comp: FicheIdentification, cat: 'Administratif' },
  { type: 'contrat_travail', label: 'Contrat de travail', icon: Briefcase, comp: ContratTravail, cat: 'Contrats' },
  { type: 'avenant_contrat', label: 'Avenant au contrat', icon: Edit3, comp: AvenantContrat, cat: 'Contrats' },
  { type: 'attestation_travail', label: 'Attestation de travail', icon: FileText, comp: AttestationTravail, cat: 'Attestations' },
  { type: 'certificat_travail', label: 'Certificat de travail', icon: FileText, comp: CertificatTravail, cat: 'Attestations' },
  { type: 'solde_tout_compte', label: 'Solde de tout compte', icon: Calculator, comp: SoldeToutCompte, cat: 'Fin de contrat' },
  { type: 'bulletin_paie', label: 'Bulletin de paie', icon: DollarSign, comp: BulletinPaie, cat: 'Paie' },
  { type: 'ordre_mission', label: 'Ordre de mission', icon: Calendar, comp: OrdreMission, cat: 'Missions' },
  { type: 'note_frais', label: 'Note de frais', icon: DollarSign, comp: NoteFrais, cat: 'Frais' },
  { type: 'demande_conge', label: 'Demande de congé', icon: Calendar, comp: DemandeConge, cat: 'Congés' },
  { type: 'entretien_annuel', label: 'Entretien annuel', icon: TrendingUp, comp: EntretienAnnuel, cat: 'Suivi' },
  { type: 'fiche_onboarding', label: 'Fiche d\'onboarding', icon: Users, comp: FicheOnboarding, cat: 'Administratif' },
  { type: 'visite_medicale', label: 'Visite médicale', icon: Calendar, comp: VisiteMedicale, cat: 'Santé' },
  { type: 'recu_materiel', label: 'Réception de matériel', icon: Briefcase, comp: RecuMateriel, cat: 'Matériel' },
]

export default function RH() {
  const { state, dispatch, stats } = useApp()
  const { canExport } = useAbonnement()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [onglet, setOnglet] = useState('employes')
  const [docModal, setDocModal] = useState(null)
  const [docEmploye, setDocEmploye] = useState(null)
  const [form, setForm] = useState({
    nom: '', poste: '', salaire: '', dateEmbauche: '', telephone: '',
    email: '', matricule: '', civilite: 'M.', prenom: '',
    dateNaissance: '', lieuNaissance: '', nationalite: 'Cameroun',
    adresse: '', numSecu: '', situationFamiliale: 'Célibataire', nbEnfants: 0,
    iban: '', bic: '', contactUrgence: '', lienParente: '', telUrgence: '',
    siteTravail: '', emailPro: '', telephonePro: '',
  })

  const employes = state.employes.filter(e => e.statut === 'actif' || !e.statut)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nom || !form.poste || !form.salaire) return
    const employe = { ...form, salaire: parseInt(form.salaire), statut: 'actif' }
    if (editId) {
      dispatch({ type: 'UPDATE_EMPLOYE', payload: { id: editId, ...employe } })
    } else {
      dispatch({ type: 'ADD_EMPLOYE', payload: employe })
    }
    resetForm()
    setShowModal(false)
  }

  const resetForm = () => setForm({
    nom: '', poste: '', salaire: '', dateEmbauche: '', telephone: '',
    email: '', matricule: '', civilite: 'M.', prenom: '',
    dateNaissance: '', lieuNaissance: '', nationalite: 'Cameroun',
    adresse: '', numSecu: '', situationFamiliale: 'Célibataire', nbEnfants: 0,
    iban: '', bic: '', contactUrgence: '', lienParente: '', telUrgence: '',
    siteTravail: '', emailPro: '', telephonePro: '',
  })

  const handleEdit = (emp) => {
    setForm({
      nom: emp.nom || '', poste: emp.poste || '', salaire: emp.salaire || '',
      dateEmbauche: emp.dateEmbauche || '', telephone: emp.telephone || '',
      email: emp.email || '', matricule: emp.matricule || '', civilite: emp.civilite || 'M.',
      prenom: emp.prenom || '', dateNaissance: emp.dateNaissance || '',
      lieuNaissance: emp.lieuNaissance || '', nationalite: emp.nationalite || 'Cameroun',
      adresse: emp.adresse || '', numSecu: emp.numSecu || '',
      situationFamiliale: emp.situationFamiliale || 'Célibataire', nbEnfants: emp.nbEnfants || 0,
      iban: emp.iban || '', bic: emp.bic || '', contactUrgence: emp.contactUrgence || '',
      lienParente: emp.lienParente || '', telUrgence: emp.telUrgence || '',
      siteTravail: emp.siteTravail || '', emailPro: emp.emailPro || '', telephonePro: emp.telephonePro || '',
    })
    setEditId(emp.id)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (confirm('Supprimer cet employé ?')) {
      dispatch({ type: 'DELETE_EMPLOYE', payload: id })
    }
  }

  const handleExportEmployesPDF = async () => {
    if (!canExport) {
      alert('Export PDF indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    const rows = state.employes.map((e) => {
      const { cnps, irpp, net } = calculerSalaireNet(e.salaire)
      return { ...e, cnps, irpp, net }
    })
    await generateTablePDF({
      titre: 'Liste des employés',
      columns: [
        { header: 'Nom', key: 'nom' },
        { header: 'Poste', key: 'poste' },
        { header: 'Salaire brut', key: 'salaire', format: formatFCFA },
        { header: 'CNPS', key: 'cnps', format: formatFCFA },
        { header: 'IRPP', key: 'irpp', format: formatFCFA },
        { header: 'Net à payer', key: 'net', format: formatFCFA },
        { header: 'Téléphone', key: 'telephone' },
      ],
      rows,
      entreprise: state.entreprise,
      filename: 'employes',
    })
  }

  const generateFichePaie = (employe) => {
    if (!canExport) {
      alert('Fiche de paie indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    const { cnps, irpp, net } = calculerSalaireNet(employe.salaire)
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFillColor(27, 58, 92)
    doc.rect(0, 0, pageWidth, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('FICHE DE PAIE', 15, 18)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(state.entreprise.nom || 'Mon Entreprise', 15, 25)
    doc.text('Mois : Août 2026', 15, 30)

    let y = 50
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)

    const addLine = (label, value) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 15, y)
      doc.setFont('helvetica', 'normal')
      doc.text(String(value), 80, y)
      y += 7
    }

    addLine('Nom :', employe.nom)
    addLine('Poste :', employe.poste)
    addLine('Date d\'embauche :', employe.dateEmbauche || '—')

    y += 5
    doc.setDrawColor(27, 58, 92)
    doc.setLineWidth(0.3)
    doc.line(15, y, pageWidth - 15, y)
    y += 10

    addLine('Salaire brut :', formatFCFA(employe.salaire))
    addLine('CNPS (4,2%) :', '-' + formatFCFA(cnps))
    addLine('IRPP (10%) :', '-' + formatFCFA(irpp))

    y += 3
    doc.setDrawColor(27, 58, 92)
    doc.setLineWidth(0.5)
    doc.line(15, y, pageWidth - 15, y)
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('SALAIRE NET À PAYER :', 15, y)
    doc.text(formatFCFA(net), 100, y)

    const footerY = doc.internal.pageSize.getHeight() - 15
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(173, 181, 189)
    doc.text('Fiche de paie générée par Koleya — ERP PME', 15, footerY)

    doc.save(`Fiche-Paie-${employe.nom.replace(/\s+/g, '-')}-Août-2026.pdf`)
  }

  const DocumentModal = ({ doc, employe }) => {
    const Comp = doc.comp
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl my-8">
          <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark-900">{doc.label}</h3>
            <button onClick={() => setDocModal(null)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <Comp employe={employe} entreprise={state.entreprise} onClose={() => setDocModal(null)} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-xs text-dark-500">Employés</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{stats.nbEmployes}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-accent-600" />
            </div>
            <span className="text-xs text-dark-500">Masse salariale</span>
          </div>
          <p className="text-xl font-bold text-accent-600 font-display">{formatFCFA(stats.masseSalariale)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-success-600" />
            </div>
            <span className="text-xs text-dark-500">CNPS (4,2%)</span>
          </div>
          <p className="text-xl font-bold text-success-600 font-display">{formatFCFA(Math.round(stats.masseSalariale * 0.042))}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-danger-600" />
            </div>
            <span className="text-xs text-dark-500">IRPP</span>
          </div>
          <p className="text-xl font-bold text-danger-600 font-display">
            {formatFCFA(employes.reduce((s, e) => s + calculerSalaireNet(e.salaire || 0).irpp, 0))}
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1 w-fit">
        {['employes', 'paie', 'documents'].map((tab) => (
          <button key={tab} onClick={() => setOnglet(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              onglet === tab ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
            }`}>
            {tab === 'employes' ? 'Employés' : tab === 'paie' ? 'Fiches de paie' : 'Documents RH'}
          </button>
        ))}
      </div>

      {onglet === 'employes' && (
        <>
          <div className="flex justify-end gap-3">
            <button onClick={handleExportEmployesPDF} className="btn-secondary">
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
            <button onClick={() => { resetForm(); setEditId(null); setShowModal(true) }} className="btn-primary">
              <Plus className="w-4 h-4" />
              Nouvel employé
            </button>
          </div>

          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Poste</th>
                  <th>Salaire brut</th>
                  <th>CNPS</th>
                  <th>IRPP</th>
                  <th>Net à payer</th>
                  <th>Date d’embauche</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employes.map((emp) => {
                  const { cnps, irpp, net } = calculerSalaireNet(emp.salaire || 0)
                  return (
                    <tr key={emp.id}>
                      <td className="font-medium">{emp.nom}</td>
                      <td><span className="badge bg-primary-50 text-primary-700">{emp.poste}</span></td>
                      <td>{formatFCFA(emp.salaire)}</td>
                      <td className="text-accent-600">{formatFCFA(cnps)}</td>
                      <td className="text-danger-600">{formatFCFA(irpp)}</td>
                      <td className="font-bold text-success-600">{formatFCFA(net)}</td>
                      <td className="text-dark-600 text-sm">{emp.dateEmbauche || '—'}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => generateFichePaie(emp)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600" title="Fiche de paie PDF">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(emp)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500" title="Modifier">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {onglet === 'paie' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employes.map((emp) => {
            const { cnps, irpp, net } = calculerSalaireNet(emp.salaire || 0)
            return (
              <div key={emp.id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-700">{(emp.nom || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-dark-900">{emp.nom}</p>
                      <p className="text-xs text-dark-500">{emp.poste}</p>
                    </div>
                  </div>
                  <button onClick={() => generateFichePaie(emp)} className="btn-secondary text-xs">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-500">Salaire brut</span>
                    <span className="font-medium">{formatFCFA(emp.salaire)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">CNPS (4,2%)</span>
                    <span className="text-danger-600">- {formatFCFA(cnps)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">IRPP (10%)</span>
                    <span className="text-danger-600">- {formatFCFA(irpp)}</span>
                  </div>
                  <div className="border-t border-dark-200 pt-2 flex justify-between">
                    <span className="font-semibold">Net à payer</span>
                    <span className="font-bold text-success-600">{formatFCFA(net)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {onglet === 'documents' && (
        <div className="space-y-6">
          {!docModal && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-dark-500">Sélectionnez un employé :</span>
              <select
                value={docEmploye?.id || ''}
                onChange={(e) => {
                  const emp = employes.find(x => x.id === e.target.value) || null
                  setDocEmploye(emp)
                }}
                className="input max-w-xs">
                <option value="">— Choisir —</option>
                {employes.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nom} — {emp.poste}</option>
                ))}
              </select>
            </div>
          )}

          {!docEmploye && (
            <div className="text-center text-dark-400 py-12 bg-white rounded-2xl border border-dashed border-dark-200">
              <FileText className="w-10 h-10 mx-auto mb-3 text-dark-300" />
              <p>Choisissez un employé pour générer un document RH.</p>
            </div>
          )}

          {docEmploye && !docModal && (
            <div className="space-y-4">
              {Object.entries(DOCUMENTS_RH.reduce((acc, d) => {
                (acc[d.cat] = acc[d.cat] || []).push(d)
                return acc
              }, {})).map(([cat, docs]) => (
                <div key={cat}>
                  <h3 className="text-sm font-semibold text-dark-700 mb-2">{cat}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {docs.map((doc) => {
                      const Icon = doc.icon
                      return (
                        <button
                          key={doc.type}
                          onClick={() => setDocModal(doc)}
                          className="card p-4 text-left hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4.5 h-4.5 text-primary-600" />
                          </div>
                          <span className="text-sm font-medium text-dark-800">{doc.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {docModal && (
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setDocModal(null)} className="btn-secondary text-xs">
                ← Retour aux documents
              </button>
              <span className="text-sm text-dark-500">Employé : <strong>{docEmploye.nom}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Modal employé */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-dark-100 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-dark-900">{editId ? 'Modifier employé' : 'Nouvel employé'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <fieldset className="border border-dark-200 rounded-xl p-4">
                <legend className="text-sm font-semibold text-primary-600 px-2">Identité</legend>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="input-label">Civilité</label>
                    <select value={form.civilite} onChange={(e) => setForm({ ...form, civilite: e.target.value })} className="input select">
                      <option value="M.">M.</option>
                      <option value="Mme">Mme</option>
                      <option value="Mlle">Mlle</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Prénom</label>
                    <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Nom *</label>
                    <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input" required />
                  </div>
                  <div>
                    <label className="input-label">Matricule</label>
                    <input type="text" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} className="input" placeholder="EMP-001" />
                  </div>
                  <div>
                    <label className="input-label">Date de naissance</label>
                    <input type="date" value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Lieu de naissance</label>
                    <input type="text" value={form.lieuNaissance} onChange={(e) => setForm({ ...form, lieuNaissance: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Nationalité</label>
                    <input type="text" value={form.nationalite} onChange={(e) => setForm({ ...form, nationalite: e.target.value })} className="input" />
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-dark-200 rounded-xl p-4">
                <legend className="text-sm font-semibold text-primary-600 px-2">Poste & rémunération</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Poste *</label>
                    <input type="text" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} className="input" required />
                  </div>
                  <div>
                    <label className="input-label">Salaire brut (FCFA) *</label>
                    <input type="number" value={form.salaire} onChange={(e) => setForm({ ...form, salaire: e.target.value })} className="input" min="0" required />
                  </div>
                  <div>
                    <label className="input-label">Date d’embauche</label>
                    <input type="date" value={form.dateEmbauche} onChange={(e) => setForm({ ...form, dateEmbauche: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Site de travail</label>
                    <input type="text" value={form.siteTravail} onChange={(e) => setForm({ ...form, siteTravail: e.target.value })} className="input" />
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-dark-200 rounded-xl p-4">
                <legend className="text-sm font-semibold text-primary-600 px-2">Coordonnées</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Téléphone</label>
                    <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="input" placeholder="+237 6XX XXX XXX" />
                  </div>
                  <div>
                    <label className="input-label">Email pro</label>
                    <input type="email" value={form.emailPro} onChange={(e) => setForm({ ...form, emailPro: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Téléphone pro</label>
                    <input type="tel" value={form.telephonePro} onChange={(e) => setForm({ ...form, telephonePro: e.target.value })} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="input-label">Adresse</label>
                    <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} className="input" />
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-dark-200 rounded-xl p-4">
                <legend className="text-sm font-semibold text-primary-600 px-2">Administratif & urgence</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">N° sécurité sociale</label>
                    <input type="text" value={form.numSecu} onChange={(e) => setForm({ ...form, numSecu: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Situation familiale</label>
                    <select value={form.situationFamiliale} onChange={(e) => setForm({ ...form, situationFamiliale: e.target.value })} className="input select">
                      <option>Célibataire</option>
                      <option>Marié(e)</option>
                      <option>Divorcé(e)</option>
                      <option>Veuf(ve)</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Nb d’enfants</label>
                    <input type="number" value={form.nbEnfants} onChange={(e) => setForm({ ...form, nbEnfants: e.target.value })} className="input" min="0" />
                  </div>
                  <div>
                    <label className="input-label">IBAN</label>
                    <input type="text" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">BIC</label>
                    <input type="text" value={form.bic} onChange={(e) => setForm({ ...form, bic: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Contact urgence</label>
                    <input type="text" value={form.contactUrgence} onChange={(e) => setForm({ ...form, contactUrgence: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Lien de parenté</label>
                    <input type="text" value={form.lienParente} onChange={(e) => setForm({ ...form, lienParente: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Tél. urgence</label>
                    <input type="tel" value={form.telUrgence} onChange={(e) => setForm({ ...form, telUrgence: e.target.value })} className="input" />
                  </div>
                </div>
              </fieldset>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">{editId ? 'Modifier' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal document RH */}
      {docModal && docEmploye && (
        <DocumentModal doc={docModal} employe={docEmploye} />
      )}
    </div>
  )
}