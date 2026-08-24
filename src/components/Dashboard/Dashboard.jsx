import React from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import {
  TrendingUp, TrendingDown, DollarSign, FileText, AlertTriangle,
  Package, Users, CreditCard, ArrowUpRight, ArrowDownRight,
  ShoppingCart, Receipt, BarChart3
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

const monthlyData = [
  { mois: 'Jan', ca: 350000, depenses: 280000 },
  { mois: 'Fév', ca: 420000, depenses: 310000 },
  { mois: 'Mar', ca: 380000, depenses: 290000 },
  { mois: 'Avr', ca: 510000, depenses: 350000 },
  { mois: 'Mai', ca: 475000, depenses: 320000 },
  { mois: 'Juin', ca: 550000, depenses: 370000 },
  { mois: 'Juil', ca: 620000, depenses: 400000 },
  { mois: 'Aoû', ca: 450000, depenses: 350000 },
]

const COLORS = ['#4c6ef5', '#ff9800', '#4caf50', '#f44336']

export default function Dashboard() {
  const { state, stats } = useApp()

  const statsCards = [
    {
      label: 'Chiffre d\'affaires',
      value: formatFCFA(stats.chiffreAffaires),
      icon: TrendingUp,
      color: 'bg-primary-50 text-primary-600',
      change: '+12%',
      positive: true,
    },
    {
      label: 'Encaissé',
      value: formatFCFA(stats.encaisse),
      icon: DollarSign,
      color: 'bg-success-50 text-success-600',
      change: '+8%',
      positive: true,
    },
    {
      label: 'Impayés',
      value: formatFCFA(stats.impaye),
      icon: AlertTriangle,
      color: stats.impaye > 0 ? 'bg-danger-50 text-danger-600' : 'bg-success-50 text-success-600',
      change: stats.impaye > 0 ? 'À relancer' : 'À jour',
      positive: stats.impaye === 0,
    },
    {
      label: 'Crédits en cours',
      value: formatFCFA(stats.creditsEnCours),
      icon: CreditCard,
      color: 'bg-accent-50 text-accent-600',
      change: `${stats.nbCreditsEnCours} client(s)`,
      positive: false,
    },
  ]

  const stockAlerts = state.produits.filter(p => p.stock <= p.stockMin)

  const recentFactures = state.factures
    .filter(f => f.type === 'facture')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const pieData = [
    { name: 'Payées', value: state.factures.filter(f => f.statut === 'payee').length },
    { name: 'En attente', value: state.factures.filter(f => f.statut === 'en_attente').length },
    { name: 'En retard', value: state.factures.filter(f => f.statut === 'en_retard').length },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium flex items-center gap-1 ${stat.positive ? 'text-success-600' : 'text-danger-600'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-dark-900 font-display">{stat.value}</p>
              <p className="text-sm text-dark-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique CA */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-dark-900">Chiffre d’affaires</h3>
              <p className="text-xs text-dark-500">8 derniers mois</p>
            </div>
            <BarChart3 className="w-5 h-5 text-dark-400" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4c6ef5" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#adb5bd" />
              <YAxis tick={{ fontSize: 12 }} stroke="#adb5bd" tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [formatFCFA(value)]}
              />
              <Area type="monotone" dataKey="ca" stroke="#4c6ef5" strokeWidth={2} fill="url(#colorCa)" name="CA" />
              <Area type="monotone" dataKey="depenses" stroke="#ff9800" strokeWidth={2} fill="transparent" name="Dépenses" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition factures */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-dark-900 mb-4">Répartition factures</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} facture(s)`]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-dark-400 text-sm">
              Aucune facture
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-dark-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières factures */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
            <h3 className="text-base font-semibold text-dark-900">Dernières factures</h3>
            <Link to="/app/facturation" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Voir tout <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-dark-100">
            {recentFactures.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-5 py-3 hover:bg-dark-50/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-dark-800">{f.clientNom}</p>
                  <p className="text-xs text-dark-500">{f.numero} — {new Date(f.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-dark-900">{formatFCFA(f.total)}</p>
                  <span className={`badge ${f.statut === 'payee' ? 'badge-success' : f.statut === 'en_retard' ? 'badge-danger' : 'badge-warning'}`}>
                    {f.statut === 'payee' ? 'Payée' : f.statut === 'en_retard' ? 'En retard' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
            {recentFactures.length === 0 && (
              <div className="px-5 py-8 text-center text-dark-400 text-sm">
                Aucune facture pour le moment
              </div>
            )}
          </div>
        </div>

        {/* Alertes stock */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
            <h3 className="text-base font-semibold text-dark-900">Alertes stock</h3>
            <Link to="/app/stock" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Gérer <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-dark-100">
            {stockAlerts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-dark-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-danger-50 flex items-center justify-center">
                    <Package className="w-4 h-4 text-danger-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-800">{p.nom}</p>
                    <p className="text-xs text-dark-500">{p.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-danger-600">{p.stock} restant(s)</p>
                  <p className="text-xs text-dark-500">Min: {p.stockMin}</p>
                </div>
              </div>
            ))}
            {stockAlerts.length === 0 && (
              <div className="px-5 py-8 text-center text-dark-400 text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 text-success-500" />
                Stock suffisant pour tous les produits
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/app/stock" className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-dark-900">{stats.nbProduits}</p>
            <p className="text-xs text-dark-500">Produits en stock</p>
          </div>
        </Link>
        <Link to="/app/rh" className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-dark-900">{stats.nbEmployes}</p>
            <p className="text-xs text-dark-500">Employés actifs</p>
          </div>
        </Link>
        <Link to="/app/comptabilite" className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-danger-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-dark-900">{formatFCFA(stats.totalDepenses)}</p>
            <p className="text-xs text-dark-500">Dépenses du mois</p>
          </div>
        </Link>
        <Link to="/app/credit" className="card-hover p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-success-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-dark-900">{stats.nbCreditsEnCours}</p>
            <p className="text-xs text-dark-500">Crédits en cours</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
