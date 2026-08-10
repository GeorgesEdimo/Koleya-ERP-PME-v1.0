import React, { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  BarChart3, TrendingUp, TrendingDown, Download, Calendar,
  Users, Package, DollarSign, FileText, Printer, PieChart
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePie, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'
const COLORS = ['#4c6ef5', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4', '#e91e63', '#795548']

export default function Rapports() {
  const { state, stats } = useApp()
  const [onglet, setOnglet] = useState('bilan')

  // === Donnees rapports ===

  // Bilan mensuel
  const factures = state.factures.filter(f => f.type === 'facture')
  const totalCA = factures.reduce((s, f) => s + f.total, 0)
  const totalEncaisse = factures.reduce((s, f) => s + f.paye, 0)
  const totalImpaye = factures.reduce((s, f) => s + f.reste, 0)
  const totalDepenses = state.depenses.reduce((s, d) => s + d.montant, 0)
  const masseSalariale = state.employes.filter(e => e.statut === 'actif').reduce((s, e) => s + e.salaire, 0)
  const beneficeNet = totalCA - totalDepenses - masseSalariale
  const tauxRecouvrement = totalCA > 0 ? Math.round((totalEncaisse / totalCA) * 100) : 0

  // Top clients (par montant facture)
  const clientsData = {}
  factures.forEach(f => {
    if (!clientsData[f.clientNom]) clientsData[f.clientNom] = { ca: 0, nbFactures: 0, paye: 0, reste: 0 }
    clientsData[f.clientNom].ca += f.total
    clientsData[f.clientNom].nbFactures++
    clientsData[f.clientNom].paye += f.paye
    clientsData[f.clientNom].reste += f.reste
  })
  const topClients = Object.entries(clientsData)
    .map(([nom, data]) => ({ nom, ...data }))
    .sort((a, b) => b.ca - a.ca)

  // Aging clients (qui doit combien depuis combien de temps)
  const today = new Date()
  const agingClients = factures
    .filter(f => f.reste > 0)
    .map(f => {
      const joursRetard = Math.max(0, Math.floor((today - new Date(f.echeance)) / (1000 * 60 * 60 * 24)))
      let categorie = 'A jour'
      if (joursRetard > 90) categorie = '+90 jours'
      else if (joursRetard > 60) categorie = '60-90 jours'
      else if (joursRetard > 30) categorie = '30-60 jours'
      else if (joursRetard > 0) categorie = '1-30 jours'
      return { ...f, joursRetard, categorie }
    })
    .sort((a, b) => b.joursRetard - a.joursRetard)

  const agingParCategorie = agingClients.reduce((acc, f) => {
    acc[f.categorie] = (acc[f.categorie] || 0) + f.reste
    return acc
  }, {})
  const agingPieData = Object.entries(agingParCategorie)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Top produits (par valeur stock)
  const topProduits = [...state.produits]
    .sort((a, b) => (b.stock * b.prixVente) - (a.stock * a.prixVente))
    .slice(0, 10)

  // Produits en alerte
  const produitsAlerte = state.produits.filter(p => p.stock <= p.stockMin)

  // Depenses par categorie
  const depensesParCategorie = state.depenses.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] || 0) + d.montant
    return acc
  }, {})
  const depensesPieData = Object.entries(depensesParCategorie)
    .map(([name, value]) => ({ name, value }))

  // Credits en retard
  const creditsEnRetard = state.credits.filter(c => c.reste > 0 && (c.statut === 'en_retard' || new Date(c.echeance) < today))

  // === Export PDF ===
  const exportBilanPDF = () => {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()

    doc.setFillColor(27, 58, 92)
    doc.rect(0, 0, pw, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('RAPPORT FINANCIER', 15, 15)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${state.entreprise.nom} — ${new Date().toLocaleDateString('fr-FR')}`, 15, 22)

    let y = 40
    doc.setTextColor(0, 0, 0)

    const addLine = (label, value, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(10)
      doc.text(label, 15, y)
      doc.text(value, pw - 15, y, { align: 'right' })
      y += 7
    }

    addLine('CHIFFRE D\'AFFAIRES', formatFCFA(totalCA), true)
    y += 2
    addLine('Encaisse', formatFCFA(totalEncaisse))
    addLine('Impayes', formatFCFA(totalImpaye))
    addLine('Taux de recouvrement', tauxRecouvrement + '%')
    y += 5
    addLine('DEPENSES', formatFCFA(totalDepenses), true)
    y += 2
    state.depenses.forEach(d => {
      addLine('  ' + d.categorie + ' - ' + d.description, formatFCFA(d.montant))
    })
    y += 5
    addLine('MASSE SALARIALE', formatFCFA(masseSalariale), true)
    y += 5
    doc.setDrawColor(27, 58, 92)
    doc.setLineWidth(0.5)
    doc.line(15, y, pw - 15, y)
    y += 8
    addLine('BENEFICE NET', formatFCFA(beneficeNet), true)

    doc.save(`Rapport-Financier-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const exportAgingPDF = () => {
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()

    doc.setFillColor(27, 58, 92)
    doc.rect(0, 0, pw, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('RAPPORT AGING CLIENTS', 15, 15)
    doc.setFontSize(9)
    doc.text(`${state.entreprise.nom} — ${new Date().toLocaleDateString('fr-FR')}`, 15, 22)

    doc.autoTable({
      startY: 38,
      head: [['Client', 'Facture', 'Montant', 'Reste', 'Jours retard', 'Categorie']],
      body: agingClients.map(f => [
        f.clientNom, f.numero,
        formatFCFA(f.total), formatFCFA(f.reste),
        f.joursRetard + 'j', f.categorie
      ]),
      headStyles: { fillColor: [27, 58, 92], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 15, right: 15 },
    })

    doc.save(`Aging-Clients-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Onglets */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-dark-200/50 p-1 w-fit overflow-x-auto">
        {[
          { id: 'bilan', label: 'Bilan financier' },
          { id: 'clients', label: 'Top clients' },
          { id: 'aging', label: 'Aging clients' },
          { id: 'stock', label: 'Stock' },
          { id: 'depenses', label: 'Depenses' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setOnglet(tab.id)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              onglet === tab.id ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* === BILAN FINANCIER === */}
      {onglet === 'bilan' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-dark-900 font-display">Bilan Financier</h2>
            <button onClick={exportBilanPDF} className="btn-primary text-sm">
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="stat-card border-l-4 border-primary-500">
              <span className="text-xs text-dark-500">CA Total</span>
              <p className="text-lg font-bold text-primary-600 font-display">{formatFCFA(totalCA)}</p>
            </div>
            <div className="stat-card border-l-4 border-success-500">
              <span className="text-xs text-dark-500">Encaisse</span>
              <p className="text-lg font-bold text-success-600 font-display">{formatFCFA(totalEncaisse)}</p>
            </div>
            <div className="stat-card border-l-4 border-danger-500">
              <span className="text-xs text-dark-500">Impayes</span>
              <p className="text-lg font-bold text-danger-600 font-display">{formatFCFA(totalImpaye)}</p>
            </div>
            <div className="stat-card border-l-4 border-accent-500">
              <span className="text-xs text-dark-500">Depenses + Salaires</span>
              <p className="text-lg font-bold text-accent-600 font-display">{formatFCFA(totalDepenses + masseSalariale)}</p>
            </div>
            <div className="stat-card border-l-4 border-dark-500">
              <span className="text-xs text-dark-500">Benefice net</span>
              <p className={`text-lg font-bold font-display ${beneficeNet >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {beneficeNet >= 0 ? '+' : ''}{formatFCFA(beneficeNet)}
              </p>
            </div>
          </div>

          {/* Taux */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5">
              <p className="text-sm text-dark-500 mb-1">Taux de recouvrement</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-primary-600 font-display">{tauxRecouvrement}%</p>
                <div className="flex-1 bg-dark-100 rounded-full h-3 mb-1">
                  <div className="bg-primary-500 h-3 rounded-full transition-all" style={{ width: `${tauxRecouvrement}%` }} />
                </div>
              </div>
            </div>
            <div className="card p-5">
              <p className="text-sm text-dark-500 mb-1">Credits en retard</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-danger-600 font-display">{creditsEnRetard.length}</p>
                <p className="text-sm text-dark-500 mb-1">client(s) en retard</p>
              </div>
            </div>
          </div>

          {/* Recapitulatif */}
          <div className="card p-5">
            <h3 className="text-base font-semibold text-dark-900 mb-4">Recapitulatif</h3>
            <div className="space-y-3">
              {[
                { label: 'Chiffre d\'affaires', value: totalCA, color: 'text-primary-600' },
                { label: 'Depenses', value: -totalDepenses, color: 'text-danger-600' },
                { label: 'Masse salariale', value: -masseSalariale, color: 'text-accent-600' },
                { label: 'Benefice net', value: beneficeNet, color: beneficeNet >= 0 ? 'text-success-600' : 'text-danger-600', bold: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-dark-100 last:border-0">
                  <span className="text-sm text-dark-700">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.color} ${item.bold ? 'text-base' : ''}`}>
                    {item.value >= 0 ? '+' : ''}{formatFCFA(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === TOP CLIENTS === */}
      {onglet === 'clients' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-dark-900 font-display">Classement Clients</h2>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-dark-900 mb-4">Chiffre d'affaires par client</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClients} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v/1000}k`} />
                <YAxis dataKey="nom" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v) => [formatFCFA(v), 'CA']} />
                <Bar dataKey="ca" fill="#4c6ef5" radius={[0, 4, 4, 0]} name="CA" />
                <Bar dataKey="paye" fill="#4caf50" radius={[0, 4, 4, 0]} name="Paye" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Factures</th>
                  <th>CA Total</th>
                  <th>Paye</th>
                  <th>Reste</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c, i) => (
                  <tr key={c.nom}>
                    <td className="font-medium">{i + 1}</td>
                    <td className="font-medium">{c.nom}</td>
                    <td>{c.nbFactures}</td>
                    <td className="font-semibold">{formatFCFA(c.ca)}</td>
                    <td className="text-success-600">{formatFCFA(c.paye)}</td>
                    <td className={`font-semibold ${c.reste > 0 ? 'text-danger-600' : 'text-dark-400'}`}>{formatFCFA(c.reste)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === AGING CLIENTS === */}
      {onglet === 'aging' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-dark-900 font-display">Aging Clients — Creances par anciennete</h2>
            <button onClick={exportAgingPDF} className="btn-primary text-sm">
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {['A jour', '1-30 jours', '30-60 jours', '60-90 jours', '+90 jours'].map(cat => (
              <div key={cat} className={`card p-4 text-center ${
                cat === '+90 jours' ? 'border-2 border-danger-300' :
                cat === '60-90 jours' ? 'border-2 border-accent-300' :
                cat === '30-60 jours' ? 'border-2 border-accent-200' : ''
              }`}>
                <p className="text-xs text-dark-500 mb-1">{cat}</p>
                <p className="text-lg font-bold text-dark-900 font-display">{formatFCFA(agingParCategorie[cat] || 0)}</p>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-dark-900 mb-4">Repartition des creances</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RePie>
                <Pie data={agingPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {agingPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [formatFCFA(v)]} />
              </RePie>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {agingPieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-dark-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Facture</th>
                  <th>Reste</th>
                  <th>Jours retard</th>
                  <th>Categorie</th>
                </tr>
              </thead>
              <tbody>
                {agingClients.map(f => (
                  <tr key={f.id}>
                    <td className="font-medium">{f.clientNom}</td>
                    <td>{f.numero}</td>
                    <td className="font-semibold text-danger-600">{formatFCFA(f.reste)}</td>
                    <td>{f.joursRetard}j</td>
                    <td>
                      <span className={`badge text-[10px] ${
                        f.categorie === '+90 jours' ? 'badge-danger' :
                        f.categorie === '60-90 jours' ? 'badge-warning' :
                        f.categorie === '30-60 jours' ? 'bg-accent-50 text-accent-700' :
                        'badge-info'
                      }`}>
                        {f.categorie}
                      </span>
                    </td>
                  </tr>
                ))}
                {agingClients.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 text-dark-400">Aucune creance en cours</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === STOCK === */}
      {onglet === 'stock' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-dark-900 font-display">Rapport Stock</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card">
              <span className="text-xs text-dark-500">Valeur totale du stock</span>
              <p className="text-xl font-bold text-primary-600 font-display">{formatFCFA(stats.valeurStock)}</p>
            </div>
            <div className="stat-card">
              <span className="text-xs text-dark-500">Alertes stock</span>
              <p className="text-xl font-bold text-danger-600 font-display">{produitsAlerte.length} produit(s)</p>
            </div>
          </div>

          {/* Top produits par valeur */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-dark-900 mb-4">Top 10 produits par valeur</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProduits} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v/1000}k`} />
                <YAxis dataKey="nom" type="category" tick={{ fontSize: 10 }} width={110} />
                <Tooltip formatter={(v) => [formatFCFA(v)]} />
                <Bar dataKey={(d) => d.stock * d.prixVente} fill="#4c6ef5" radius={[0, 4, 4, 0]} name="Valeur" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alertes stock */}
          {produitsAlerte.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-danger-600 mb-4">Produits en alerte (stock {'<='} min)</h3>
              <div className="table-container bg-white">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Reference</th>
                      <th>Stock actuel</th>
                      <th>Stock min</th>
                      <th>Ecart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produitsAlerte.map(p => (
                      <tr key={p.id}>
                        <td className="font-medium">{p.nom}</td>
                        <td className="text-dark-500 text-sm">{p.reference}</td>
                        <td className="font-bold text-danger-600">{p.stock}</td>
                        <td>{p.stockMin}</td>
                        <td className="text-danger-600 font-semibold">-{p.stockMin - p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === DEPENSES === */}
      {onglet === 'depenses' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-dark-900 font-display">Rapport Depenses</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-dark-900 mb-4">Repartition par categorie</h3>
              {depensesPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RePie>
                    <Pie data={depensesPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {depensesPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [formatFCFA(v)]} />
                  </RePie>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-dark-400 text-sm">Aucune depense</div>
              )}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {depensesPieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-dark-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {entry.name} ({formatFCFA(entry.value)})
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-dark-900 mb-4">Detail par categorie</h3>
              <div className="space-y-3">
                {depensesPieData.sort((a, b) => b.value - a.value).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between py-2 border-b border-dark-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-dark-700">{d.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-dark-900">{formatFCFA(d.value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-dark-200 flex justify-between">
                <span className="text-sm font-semibold text-dark-900">Total</span>
                <span className="text-sm font-bold text-danger-600">{formatFCFA(totalDepenses)}</span>
              </div>
            </div>
          </div>

          {/* Detail depenses */}
          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Categorie</th>
                  <th>Description</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {state.depenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(d => (
                  <tr key={d.id}>
                    <td className="text-dark-600">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                    <td><span className="badge bg-primary-50 text-primary-700">{d.categorie}</span></td>
                    <td className="font-medium">{d.description}</td>
                    <td className="font-semibold text-danger-600">- {formatFCFA(d.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
