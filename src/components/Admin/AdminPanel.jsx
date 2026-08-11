import React, { useEffect, useState } from 'react'
import {
  ShieldCheck, Building2, Users, FileText, Package, CreditCard,
  Search, RotateCcw, Plus, Edit3, Trash2, Eye, X, Loader2,
  BarChart3, RefreshCcw, AlertTriangle, CheckCircle
} from 'lucide-react'
import { adminAPI } from '../../utils/api'

const ressources = [
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'factures', label: 'Factures', icon: FileText },
  { key: 'credits', label: 'Credits', icon: CreditCard },
  { key: 'produits', label: 'Produits', icon: Package },
]

const ROLES = ['proprietaire', 'admin', 'comptable', 'employe']
const PLANS = ['starter', 'pro', 'business']

export default function AdminPanel() {
  // Entreprises
  const [entreprises, setEntreprises] = useState([])
  const [selectedEntreprise, setSelectedEntreprise] = useState(null)
  const [entrepriseDetail, setEntrepriseDetail] = useState(null)

  // Utilisateurs
  const [users, setUsers] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ email: '', mot_de_passe: '', nom: '', telephone: '', role: 'employe' })

  // Ressources
  const [ressource, setRessource] = useState('factures')
  const [items, setItems] = useState([])
  const [voirSupprimes, setVoirSupprimes] = useState(false)

  // UI
  const [onglet, setOnglet] = useState('entreprises')
  const [msg, setMsg] = useState({ text: '', type: 'success' })
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)

  // Charger les donnees initiales
  useEffect(() => {
    loadEntreprises()
    loadStats()
  }, [])

  useEffect(() => {
    if (selectedEntreprise && onglet === 'donnees') {
      loadRessource()
    }
    if (selectedEntreprise && onglet === 'utilisateurs') {
      loadUsers()
    }
  }, [selectedEntreprise, ressource, voirSupprimes, onglet])

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4000)
  }

  const loadEntreprises = async () => {
    try {
      const data = await adminAPI.entreprises()
      setEntreprises(data.entreprises || [])
    } catch (e) { showMsg(e.message, 'error') }
  }

  const loadStats = async () => {
    try {
      const data = await adminAPI.stats()
      setStats(data)
    } catch (e) { /* ignore */ }
  }

  const loadEntrepriseDetail = async (id) => {
    try {
      const data = await adminAPI.entreprise(id)
      setEntrepriseDetail(data)
    } catch (e) { showMsg(e.message, 'error') }
  }

  const loadRessource = async () => {
    if (!selectedEntreprise) return
    setLoading(true)
    try {
      const data = await adminAPI.ressource(selectedEntreprise, ressource, voirSupprimes ? 'true' : undefined)
      setItems(data[ressource] || [])
    } catch (e) { showMsg(e.message, 'error') }
    setLoading(false)
  }

  const loadUsers = async () => {
    if (!selectedEntreprise) return
    setLoading(true)
    try {
      const data = await adminAPI.utilisateurs({ entreprise_id: selectedEntreprise })
      setUsers(data.utilisateurs || [])
    } catch (e) { showMsg(e.message, 'error') }
    setLoading(false)
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await adminAPI.createUser({ ...userForm, entreprise_id: selectedEntreprise })
      showMsg('Utilisateur cree')
      setShowUserModal(false)
      setUserForm({ email: '', mot_de_passe: '', nom: '', telephone: '', role: 'employe' })
      loadUsers()
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await adminAPI.deleteUser(id)
      showMsg('Utilisateur supprime')
      loadUsers()
    } catch (e) { showMsg(e.message, 'error') }
  }

  const restaurer = async (table, id) => {
    try {
      await adminAPI.restaurer(table, id)
      showMsg('Element restaure')
      loadRessource()
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleDeleteEntreprise = async (id, nom) => {
    if (!confirm(`Supprimer definitivement l'entreprise "${nom}" ? Cette action est irreversible.`)) return
    try {
      await adminAPI.deleteEntreprise(id)
      showMsg(`Entreprise "${nom}" supprimee`)
      setSelectedEntreprise(null)
      setEntrepriseDetail(null)
      loadEntreprises()
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleToggleEntreprise = async (id, actif) => {
    try {
      await adminAPI.updateEntreprise(id, { actif: !actif })
      showMsg(actif ? 'Entreprise suspendue' : 'Entreprise reactivatee')
      loadEntreprises()
      if (selectedEntreprise === id) loadEntrepriseDetail(id)
    } catch (e) { showMsg(e.message, 'error') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="page-title">Administration plateforme</h1>
            <p className="text-xs text-dark-500">Super administrateur — CRUD complet</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {msg.text && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
          msg.type === 'error' ? 'bg-danger-50 border border-danger-200 text-danger-700' : 'bg-success-50 border border-success-200 text-success-700'
        }`}>
          {msg.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Stats globales */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Entreprises', value: stats.total_entreprises, icon: Building2, color: 'bg-primary-50 text-primary-600' },
            { label: 'Utilisateurs', value: stats.total_utilisateurs, icon: Users, color: 'bg-accent-50 text-accent-600' },
            { label: 'Factures', value: stats.total_factures, icon: FileText, color: 'bg-success-50 text-success-600' },
            { label: 'Actives', value: stats.entreprises_actives, icon: CheckCircle, color: 'bg-primary-50 text-primary-600' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-dark-500">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-dark-900 font-display">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Onglets */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1 w-fit">
        {[
          { id: 'entreprises', label: 'Entreprises', icon: Building2 },
          { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
          { id: 'donnees', label: 'Donnees', icon: FileText },
        ].map(tab => (
          <button key={tab.id} onClick={() => setOnglet(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              onglet === tab.id ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === ENTREPRISES === */}
      {onglet === 'entreprises' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-5 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-dark-900">Entreprises ({entreprises.length})</h2>
              <button onClick={loadEntreprises} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {entreprises.map(e => (
                <button
                  key={e.id}
                  onClick={() => { setSelectedEntreprise(e.id); loadEntrepriseDetail(e.id) }}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    selectedEntreprise === e.id ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:bg-dark-50'
                  }`}
                >
                  <p className="font-medium text-dark-900 truncate">{e.nom}</p>
                  <p className="text-xs text-dark-500">
                    Plan {e.plan} · {e.nb_utilisateurs || 0} users · {e.nb_factures || 0} factures
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5 lg:col-span-2">
            {!selectedEntreprise ? (
              <p className="text-sm text-dark-400 flex items-center gap-2">
                <Search className="w-4 h-4" /> Selectionnez une entreprise.
              </p>
            ) : entrepriseDetail && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-dark-900">{entrepriseDetail.nom}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleEntreprise(selectedEntreprise, entrepriseDetail.actif)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium ${entrepriseDetail.actif ? 'bg-warning-50 text-warning-700 hover:bg-warning-100' : 'bg-success-50 text-success-700 hover:bg-success-100'}`}>
                      {entrepriseDetail.actif ? 'Suspendre' : 'Reactiver'}
                    </button>
                    <button onClick={() => handleDeleteEntreprise(selectedEntreprise, entrepriseDetail.nom)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-danger-50 text-danger-700 hover:bg-danger-100">
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Plan', value: entrepriseDetail.plan },
                    { label: 'Utilisateurs', value: entrepriseDetail.nb_utilisateurs },
                    { label: 'Clients', value: entrepriseDetail.nb_clients },
                    { label: 'CA total', value: `${entrepriseDetail.ca_total?.toLocaleString()} FCFA` },
                  ].map(s => (
                    <div key={s.label} className="bg-dark-50 rounded-xl p-3">
                      <p className="text-xs text-dark-500">{s.label}</p>
                      <p className="text-sm font-bold text-dark-900">{s.value}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-dark-400">
                  {entrepriseDetail.essai_active
                    ? `Essai actif jusqu'au ${new Date(entrepriseDetail.essai_fin).toLocaleDateString('fr-FR')}`
                    : 'Compte payant actif'}
                  {' · '}Creee le {new Date(entrepriseDetail.cree_le).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === UTILISATEURS === */}
      {onglet === 'utilisateurs' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-dark-900">
              Utilisateurs {selectedEntreprise ? `de l'entreprise` : '(selectionnez une entreprise)'}
            </h2>
            {selectedEntreprise && (
              <button onClick={() => setShowUserModal(true)} className="btn-primary text-sm">
                <Plus className="w-4 h-4" /> Nouvel utilisateur
              </button>
            )}
          </div>

          {!selectedEntreprise ? (
            <p className="text-sm text-dark-400">Selectionnez une entreprise dans l'onglet "Entreprises".</p>
          ) : loading ? (
            <p className="text-sm text-dark-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-dark-400">Aucun utilisateur.</p>
          ) : (
            <div className="table-container bg-white">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Statut</th>
                    <th>Derniere connexion</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.nom}</td>
                      <td className="text-dark-600">{u.email}</td>
                      <td><span className="badge bg-primary-50 text-primary-700">{u.role}</span></td>
                      <td><span className={`badge ${u.actif ? 'badge-success' : 'badge-danger'}`}>{u.actif ? 'Actif' : 'Inactif'}</span></td>
                      <td className="text-dark-500 text-xs">{u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                      <td className="text-right">
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal creation utilisateur */}
          {showUserModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                <div className="px-6 py-4 border-b border-dark-100 flex justify-between">
                  <h3 className="text-lg font-semibold text-dark-900">Nouvel utilisateur</h3>
                  <button onClick={() => setShowUserModal(false)} className="p-1 rounded-lg hover:bg-dark-100"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                  <div>
                    <label className="input-label">Nom *</label>
                    <input type="text" value={userForm.nom} onChange={e => setUserForm({ ...userForm, nom: e.target.value })} className="input" required />
                  </div>
                  <div>
                    <label className="input-label">Email *</label>
                    <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="input" required />
                  </div>
                  <div>
                    <label className="input-label">Mot de passe *</label>
                    <input type="password" value={userForm.mot_de_passe} onChange={e => setUserForm({ ...userForm, mot_de_passe: e.target.value })} className="input" required minLength={8} />
                  </div>
                  <div>
                    <label className="input-label">Role</label>
                    <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="select">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary">Annuler</button>
                    <button type="submit" className="btn-primary">Creer</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === DONNEES (CRUD ressources) === */}
      {onglet === 'donnees' && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {ressources.map(r => (
              <button key={r.key} onClick={() => setRessource(r.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  ressource === r.key ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                }`}>
                <r.icon className="w-3.5 h-3.5" /> {r.label}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm text-dark-600">
              <input type="checkbox" checked={voirSupprimes} onChange={e => setVoirSupprimes(e.target.checked)} className="accent-primary-600" />
              Supprimes (restaurables)
            </label>
          </div>

          {!selectedEntreprise ? (
            <p className="text-sm text-dark-400">Selectionnez une entreprise dans l'onglet "Entreprises".</p>
          ) : loading ? (
            <p className="text-sm text-dark-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-dark-400">Aucun element.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {items.map(it => (
                <div key={it.id} className="flex items-center justify-between rounded-xl border border-dark-200 px-3 py-2 text-sm hover:bg-dark-50">
                  <div className="min-w-0">
                    <p className="font-medium text-dark-900 truncate">
                      {it.nom || it.numero || it.client_nom || it.description || it.id}
                    </p>
                    <p className="text-xs text-dark-500">
                      {it.total && `Total: ${it.total} FCFA`}
                      {it.statut && ` · Statut: ${it.statut}`}
                      {it.salaire && ` · Salaire: ${it.salaire} FCFA`}
                      {it.montant && ` · Montant: ${it.montant} FCFA`}
                      {it.cree_le && ` · ${new Date(it.cree_le).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {voirSupprimes && (
                      <button onClick={() => restaurer(ressource, it.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-success-600 hover:text-success-700 px-2 py-1 rounded-lg hover:bg-success-50">
                        <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
