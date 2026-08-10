import React, { useState, useEffect } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  Bell, Send, MessageCircle, Smartphone, CheckCircle,
  AlertTriangle, Clock, Trash2, RefreshCw, Filter, Search,
  Plus, Loader2, X, Mail
} from 'lucide-react'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

const typeLabels = {
  facture_relance: { label: 'Relance facture', color: 'bg-accent-50 text-accent-700', icon: AlertTriangle },
  credit_rappel: { label: 'Rappel credit', color: 'bg-danger-50 text-danger-700', icon: Clock },
  stock_alerte: { label: 'Alerte stock', color: 'bg-primary-50 text-primary-700', icon: Bell },
  manuel: { label: 'Manuel', color: 'bg-dark-100 text-dark-600', icon: Send },
}

const statutLabels = {
  envoye: { label: 'Envoye', color: 'badge-success' },
  en_attente: { label: 'En attente', color: 'badge-warning' },
  echec: { label: 'Echec', color: 'badge-danger' },
}

export default function Notifications() {
  const { state } = useApp()
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('toutes')
  const [showEnvoyer, setShowEnvoyer] = useState(false)
  const [sending, setSending] = useState(false)

  const [form, setForm] = useState({
    canal: 'whatsapp',
    destinataire: '',
    destinataire_nom: '',
    sujet: '',
    message: '',
  })

  // Simuler le chargement des notifications (côté localStorage en dev)
  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    setLoading(true)
    // En mode dev, on simule avec des données
    const stored = localStorage.getItem('koleya_notifications') || '[]'
    const data = JSON.parse(stored)
    setNotifications(data)

    const total = data.length
    const envoyees = data.filter(n => n.statut === 'envoye').length
    const echecs = data.filter(n => n.statut === 'echec').length
    const enAttente = data.filter(n => n.statut === 'en_attente').length
    const auj = data.filter(n => new Date(n.cree_le).toDateString() === new Date().toDateString()).length

    setStats({ total, envoyees, echecs, en_attente: enAttente, aujourd_hui: auj })
    setLoading(false)
  }

  const saveNotification = (notif) => {
    const stored = JSON.parse(localStorage.getItem('koleya_notifications') || '[]')
    stored.unshift(notif)
    localStorage.setItem('koleya_notifications', JSON.stringify(stored))
  }

  const handleEnvoyer = async (e) => {
    e.preventDefault()
    if (!form.destinataire || !form.message) return

    setSending(true)

    // Simuler l'envoi
    const notif = {
      id: Date.now().toString(),
      canal: form.canal,
      destinataire: form.destinataire,
      destinataire_nom: form.destinataire_nom,
      sujet: form.sujet,
      message: form.message,
      statut: 'envoye',
      type_source: 'manuel',
      date_envoi: new Date().toISOString(),
      cree_le: new Date().toISOString(),
    }

    setTimeout(() => {
      saveNotification(notif)
      setNotifications(prev => [notif, ...prev])
      setSending(false)
      setShowEnvoyer(false)
      setForm({ canal: 'whatsapp', destinataire: '', destinataire_nom: '', sujet: '', message: '' })
      loadNotifications()
    }, 1000)
  }

  const handleRelancerFacture = (facture) => {
    const notif = {
      id: Date.now().toString(),
      canal: 'whatsapp',
      destinataire: facture.client_telephone || '',
      destinataire_nom: facture.clientNom,
      sujet: `Relance ${facture.numero}`,
      message: `Bonjour ${facture.clientNom}, votre facture ${facture.numero} de ${formatFCFA(facture.reste)} reste impayee. Merci de regulariser.`,
      statut: 'envoye',
      type_source: 'facture_relance',
      source_id: facture.id,
      date_envoi: new Date().toISOString(),
      cree_le: new Date().toISOString(),
    }
    saveNotification(notif)
    setNotifications(prev => [notif, ...prev])
    loadNotifications()
    alert(`Notification envoyee a ${facture.clientNom} via WhatsApp !`)
  }

  const handleRappelerCredit = (credit) => {
    const notif = {
      id: Date.now().toString(),
      canal: 'whatsapp',
      destinataire: credit.client_telephone || '',
      destinataire_nom: credit.clientNom,
      sujet: `Rappel credit`,
      message: `Bonjour ${credit.clientNom}, votre solde de ${formatFCFA(credit.reste)} reste a payer. Merci.`,
      statut: 'envoye',
      type_source: 'credit_rappel',
      source_id: credit.id,
      date_envoi: new Date().toISOString(),
      cree_le: new Date().toISOString(),
    }
    saveNotification(notif)
    setNotifications(prev => [notif, ...prev])
    loadNotifications()
    alert(`Rappel envoye a ${credit.clientNom} via WhatsApp !`)
  }

  const handleRelancesAuto = () => {
    let count = 0

    // Relances factures en retard
    state.factures
      .filter(f => f.statut === 'en_retard' && f.reste > 0)
      .forEach(f => {
        const notif = {
          id: (Date.now() + count).toString(),
          canal: 'whatsapp',
          destinataire: state.clients.find(c => c.id === f.clientId)?.telephone || '',
          destinataire_nom: f.clientNom,
          sujet: `Relance auto ${f.numero}`,
          message: `Relance automatique: facture ${f.numero} de ${formatFCFA(f.reste)} impayee.`,
          statut: 'envoye',
          type_source: 'facture_relance',
          source_id: f.id,
          date_envoi: new Date().toISOString(),
          cree_le: new Date().toISOString(),
        }
        saveNotification(notif)
        count++
      })

    // Rappels credits
    state.credits
      .filter(c => c.statut === 'en_retard' && c.reste > 0)
      .forEach(c => {
        const notif = {
          id: (Date.now() + count).toString(),
          canal: 'whatsapp',
          destinataire: state.clients.find(cl => cl.id === c.clientId)?.telephone || '',
          destinataire_nom: c.clientNom,
          sujet: `Rappel auto credit`,
          message: `Rappel automatique: solde de ${formatFCFA(c.reste)} a payer.`,
          statut: 'envoye',
          type_source: 'credit_rappel',
          source_id: c.id,
          date_envoi: new Date().toISOString(),
          cree_le: new Date().toISOString(),
        }
        saveNotification(notif)
        count++
      })

    // Alertes stock
    state.produits
      .filter(p => p.stock <= p.stockMin)
      .forEach(p => {
        const notif = {
          id: (Date.now() + count).toString(),
          canal: 'sms',
          destinataire: state.entreprise.telephone,
          destinataire_nom: 'Gestionnaire',
          sujet: `Alerte stock ${p.nom}`,
          message: `${p.nom}: ${p.stock} restant(s) / min: ${p.stockMin}`,
          statut: 'envoye',
          type_source: 'stock_alerte',
          source_id: p.id,
          date_envoi: new Date().toISOString(),
          cree_le: new Date().toISOString(),
        }
        saveNotification(notif)
        count++
      })

    loadNotifications()
    alert(`${count} notification(s) automatique(s) envoyee(s) !`)
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette notification ?')) return
    const stored = JSON.parse(localStorage.getItem('koleya_notifications') || '[]')
    const updated = stored.filter(n => n.id !== id)
    localStorage.setItem('koleya_notifications', JSON.stringify(updated))
    loadNotifications()
  }

  const filtered = notifications.filter(n => {
    if (filter === 'toutes') return true
    if (filter === 'manuelles') return n.type_source === 'manuel'
    if (filter === 'auto') return n.type_source !== 'manuel'
    if (filter === 'echecs') return n.statut === 'echec'
    return true
  })

  // Données pour les relances rapides
  const facturesARelancer = state.factures.filter(f => f.statut === 'en_retard' && f.reste > 0)
  const creditsARappeler = state.credits.filter(c => (c.statut === 'en_retard' || c.statut === 'en_cours') && c.reste > 0)
  const alertesStock = state.produits.filter(p => p.stock <= p.stockMin)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="stat-card">
          <span className="text-xs text-dark-500">Total</span>
          <p className="text-xl font-bold text-dark-900 font-display">{stats.total || 0}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-dark-500">Envoyees</span>
          <p className="text-xl font-bold text-success-600 font-display">{stats.envoyees || 0}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-dark-500">En attente</span>
          <p className="text-xl font-bold text-accent-600 font-display">{stats.en_attente || 0}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-dark-500">Echecs</span>
          <p className="text-xl font-bold text-danger-600 font-display">{stats.echecs || 0}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-dark-500">Aujourd'hui</span>
          <p className="text-xl font-bold text-primary-600 font-display">{stats.aujourd_hui || 0}</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-dark-900 mb-4">Relances rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Factures en retard */}
          <div className="bg-accent-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-accent-600" />
                <span className="text-sm font-medium text-accent-700">Factures en retard</span>
              </div>
              <span className="badge badge-warning">{facturesARelancer.length}</span>
            </div>
            {facturesARelancer.length > 0 ? (
              <div className="space-y-2">
                {facturesARelancer.slice(0, 3).map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-white rounded-lg p-2">
                    <div>
                      <p className="text-xs font-medium">{f.clientNom}</p>
                      <p className="text-[10px] text-dark-500">{f.numero} — {formatFCFA(f.reste)}</p>
                    </div>
                    <button onClick={() => handleRelancerFacture(f)} className="p-1.5 rounded-lg hover:bg-accent-100 text-accent-600">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-dark-400">Aucune facture en retard</p>
            )}
          </div>

          {/* Credits */}
          <div className="bg-danger-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-danger-600" />
                <span className="text-sm font-medium text-danger-700">Credits en retard</span>
              </div>
              <span className="badge badge-danger">{creditsARappeler.length}</span>
            </div>
            {creditsARappeler.length > 0 ? (
              <div className="space-y-2">
                {creditsARappeler.slice(0, 3).map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-white rounded-lg p-2">
                    <div>
                      <p className="text-xs font-medium">{c.clientNom}</p>
                      <p className="text-[10px] text-dark-500">{formatFCFA(c.reste)}</p>
                    </div>
                    <button onClick={() => handleRappelerCredit(c)} className="p-1.5 rounded-lg hover:bg-danger-100 text-danger-600">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-dark-400">Aucun credit en retard</p>
            )}
          </div>

          {/* Stock */}
          <div className="bg-primary-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Alertes stock</span>
              </div>
              <span className="badge badge-info">{alertesStock.length}</span>
            </div>
            {alertesStock.length > 0 ? (
              <div className="space-y-2">
                {alertesStock.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-2">
                    <div>
                      <p className="text-xs font-medium">{p.nom}</p>
                      <p className="text-[10px] text-danger-600">{p.stock} restant(s) / min: {p.stockMin}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-dark-400">Stock suffisant</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={handleRelancesAuto} className="btn-primary text-sm">
            <RefreshCw className="w-4 h-4" />
            Envoyer toutes les relances auto
          </button>
          <button onClick={() => setShowEnvoyer(true)} className="btn-secondary text-sm">
            <Plus className="w-4 h-4" />
            Envoyer un message
          </button>
        </div>
      </div>

      {/* Filtres + Historique */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1">
          {['toutes', 'manuelles', 'auto', 'echecs'].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === tab ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
              }`}>
              {tab === 'toutes' ? 'Toutes' : tab === 'manuelles' ? 'Manuelles' : tab === 'auto' ? 'Auto' : 'Echecs'}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-2">
        {loading ? (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-dark-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-dark-300" />
            <p className="font-medium">Aucune notification</p>
            <p className="text-sm mt-1">Envoyez votre premier message ou activez les relances auto</p>
          </div>
        ) : (
          filtered.map(n => {
            const typeInfo = typeLabels[n.type_source] || typeLabels.manuel
            const statutInfo = statutLabels[n.statut] || statutLabels.en_attente
            const TypeIcon = typeInfo.icon
            return (
              <div key={n.id} className="card p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge text-[10px]">{typeInfo.label}</span>
                    <span className={`badge text-[10px] ${statutInfo.color}`}>{statutInfo.label}</span>
                    <span className="text-[10px] text-dark-400">
                      {n.canal === 'whatsapp' ? 'WhatsApp' : n.canal === 'sms' ? 'SMS' : 'Email'}
                    </span>
                  </div>
                  {n.sujet && <p className="text-sm font-medium text-dark-800">{n.sujet}</p>}
                  <p className="text-xs text-dark-500 mt-0.5 truncate">{n.message}</p>
                  <p className="text-[10px] text-dark-400 mt-1">
                    {n.destinataire_nom && `${n.destinataire_nom} — `}{n.destinataire} — {new Date(n.cree_le).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-dark-400 hover:text-danger-500 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Modal envoyer */}
      {showEnvoyer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
              <h3 className="text-lg font-semibold text-dark-900">Envoyer un message</h3>
              <button onClick={() => setShowEnvoyer(false)} className="p-1 rounded-lg hover:bg-dark-100">
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <form onSubmit={handleEnvoyer} className="p-6 space-y-4">
              <div>
                <label className="input-label">Canal</label>
                <div className="flex gap-2">
                  {[
                    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                    { value: 'sms', label: 'SMS', icon: Smartphone },
                    { value: 'email', label: 'Email', icon: Mail },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, canal: opt.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        form.canal === opt.value ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                      }`}>
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Destinataire</label>
                  <input type="text" value={form.destinataire} onChange={e => setForm({ ...form, destinataire: e.target.value })} className="input" placeholder="+237 6XX XXX" required />
                </div>
                <div>
                  <label className="input-label">Nom (optionnel)</label>
                  <input type="text" value={form.destinataire_nom} onChange={e => setForm({ ...form, destinataire_nom: e.target.value })} className="input" placeholder="Nom du client" />
                </div>
              </div>
              <div>
                <label className="input-label">Sujet (optionnel)</label>
                <input type="text" value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} className="input" placeholder="Relance facture..." />
              </div>
              <div>
                <label className="input-label">Message *</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="input min-h-[100px]" placeholder="Bonjour, nous vous rappelons..." required />
                <p className="text-[10px] text-dark-400 mt-1">{form.message.length}/1600 caracteres</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEnvoyer(false)} className="btn-secondary">Annuler</button>
                <button type="submit" disabled={sending} className="btn-primary">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
