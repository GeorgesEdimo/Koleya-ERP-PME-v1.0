import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  Plus, Calculator, TrendingUp, TrendingDown, DollarSign,
  Trash2, Edit3, PieChart as PieChartIcon, Download
} from 'lucide-react'
import { useAbonnement } from '../../contexts/AbonnementContext'
import { generateTablePDF } from '../Facturation/pdfGenerator'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

const COLORS = ['#4c6ef5', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4']

export default function Comptabilite() {
  const { state, dispatch, stats } = useApp()
  const { canExport } = useAbonnement()
  const [onglet, setOnglet] = useState('vue')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ categorie: 'Loyer', description: '', montant: '', date: new Date().toISOString().slice(0, 10) })

  const depenses = state.depenses.sort((a, b) => new Date(b.date) - new Date(a.date))

  const handleExportDepensesPDF = async () => {
    if (!canExport) {
      alert('Export PDF indisponible : votre abonnement est expiré. Choisissez un plan pour continuer.')
      return
    }
    await generateTablePDF({
      titre: 'Liste des dépenses',
      columns: [
        { header: 'Date', key: 'date' },
        { header: 'Catégorie', key: 'categorie' },
        { header: 'Description', key: 'description' },
        { header: 'Montant', key: 'montant', format: formatFCFA },
      ],
      rows: depenses,
      entreprise: state.entreprise,
      filename: 'depenses',
    })
  }

  const depensesParCategorie = depenses.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] || 0) + d.montant
    return acc
  }, {})

  const pieData = Object.entries(depensesParCategorie).map(([name, value]) => ({ name, value }))

  const benefice = stats.chiffreAffaires - stats.totalDepenses - stats.masseSalariale

  const monthlyData = [
    { mois: 'Jan', ca: 350000, depenses: 280000 },
    { mois: 'Fév', ca: 420000, depenses: 310000 },
    { mois: 'Mar', ca: 380000, depenses: 290000 },
    { mois: 'Avr', ca: 510000, depenses: 350000 },
    { mois: 'Mai', ca: 475000, depenses: 320000 },
    { mois: 'Juin', ca: 550000, depenses: 370000 },
    { mois: 'Juil', ca: 620000, depenses: 400000 },
    { mois: 'Aoû', ca: stats.chiffreAffaires, depenses: stats.totalDepenses },
  ]

  const handleSubmitDepense = async (e) => {
    e.preventDefault()
    if (!form.montant || !form.description) return
    const payload = { ...form, montant: parseInt(form.montant) }
    const res = editId
      ? await dispatch({ type: 'UPDATE_DEPENSE', payload: { id: editId, ...payload } })
      : await dispatch({ type: 'ADD_DEPENSE', payload })
    if (!res.ok) return
    setForm({ categorie: 'Loyer', description: '', montant: '', date: new Date().toISOString().slice(0, 10) })
    setEditId(null)
    setShowModal(false)
  }

  const handleEditDepense = (d) => {
    setForm({ categorie: d.categorie, description: d.description || '', montant: d.montant, date: d.date })
    setEditId(d.id)
    setShowModal(true)
  }

  const handleDeleteDepense = (id) => {
    if (confirm('Supprimer cette dépense ?')) {
      dispatch({ type: 'DELETE_DEPENSE', payload: id })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-xs text-dark-500">Chiffre d'affaires</span>
          </div>
          <p className="text-xl font-bold text-dark-900 font-display">{formatFCFA(stats.chiffreAffaires)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-danger-600" />
            </div>
            <span className="text-xs text-dark-500">Dépenses</span>
          </div>
          <p className="text-xl font-bold text-danger-600 font-display">{formatFCFA(stats.totalDepenses)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-accent-600" />
            </div>
            <span className="text-xs text-dark-500">Masse salariale</span>
          </div>
          <p className="text-xl font-bold text-accent-600 font-display">{formatFCFA(stats.masseSalariale)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${benefice >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
              <TrendingUp className={`w-4 h-4 ${benefice >= 0 ? 'text-success-600' : 'text-danger-600'}`} />
            </div>
            <span className="text-xs text-dark-500">Résultat net</span>
          </div>
          <p className={`text-xl font-bold font-display ${benefice >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {benefice >= 0 ? '+' : ''}{formatFCFA(benefice)}
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1 w-fit">
        {['vue', 'depenses'].map((tab) => (
          <button
            key={tab}
            onClick={() => setOnglet(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              onglet === tab ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
            }`}
          >
            {tab === 'vue' ? 'Vue d\'ensemble' : 'Dépenses'}
          </button>
        ))}
      </div>

      {onglet === 'vue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique */}
          <div className="card p-5">
            <h3 className="text-base font-semibold text-dark-900 mb-4">CA et dépenses</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip formatter={(value) => [formatFCFA(value)]} />
                <Bar dataKey="ca" fill="#4c6ef5" radius={[4, 4, 0, 0]} name="CA" />
                <Bar dataKey="depenses" fill="#ff9800" radius={[4, 4, 0, 0]} name="Dépenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition dépenses */}
          <div className="card p-5">
            <h3 className="text-base font-semibold text-dark-900 mb-4">Répartition des dépenses</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [formatFCFA(value)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {pieData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-dark-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {entry.name} ({formatFCFA(entry.value)})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-dark-400 text-sm">Aucune dépense enregistrée</div>
            )}
          </div>
        </div>
      )}

      {onglet === 'depenses' && (
        <>
          <div className="flex justify-end">
            <button onClick={handleExportDepensesPDF} className="btn-secondary" title="Exporter les dépenses en PDF">
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
            <button onClick={() => { setEditId(null); setShowModal(true) }} className="btn-primary">
              <Plus className="w-4 h-4" />
              Nouvelle dépense
            </button>
          </div>

          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Catégorie</th>
                  <th>Description</th>
                  <th>Montant</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {depenses.map((d) => (
                  <tr key={d.id}>
                    <td className="text-dark-600">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                    <td><span className="badge bg-primary-50 text-primary-700">{d.categorie}</span></td>
                    <td className="font-medium">{d.description}</td>
                    <td className="font-semibold text-danger-600">- {formatFCFA(d.montant)}</td>
                    <td>
                      <div className="flex justify-end">
                        <button onClick={() => handleEditDepense(d)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500 hover:text-primary-600" title="Modifier">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteDepense(d.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-dark-100">
              <h3 className="text-lg font-semibold text-dark-900">{editId ? 'Modifier la dépense' : 'Nouvelle dépense'}</h3>
            </div>
            <form onSubmit={handleSubmitDepense} className="p-6 space-y-4">
              <div>
                <label className="input-label">Catégorie</label>
                <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="select">
                  <option>Loyer</option>
                  <option>Électricité</option>
                  <option>Eau</option>
                  <option>Fournitures</option>
                  <option>Transport</option>
                  <option>Internet</option>
                  <option>Entretien</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="input-label">Description *</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Montant (FCFA) *</label>
                  <input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className="input" min="0" required />
                </div>
                <div>
                  <label className="input-label">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
