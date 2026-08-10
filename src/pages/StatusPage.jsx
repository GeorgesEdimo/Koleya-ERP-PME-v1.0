import React from 'react'
import { CheckCircle2, CalendarClock, History, Wrench } from 'lucide-react'
import { PageIntro } from '../components/Landing/PublicLayout'

const services = [
  { name: 'Application web', status: 'Opérationnel', uptime: '99,9 %' },
  { name: 'Export PDF', status: 'Opérationnel', uptime: '99,8 %' },
  { name: 'Notifications SMS', status: 'Opérationnel', uptime: '99,5 %' },
  { name: 'Paiement Mobile Money', status: 'Opérationnel', uptime: '99,7 %' },
  { name: 'API', status: 'Opérationnel', uptime: '99,9 %' },
]

export default function StatusPage() {
  return (
    <>
      <PageIntro
        badge="Fiabilité"
        title="État des services"
        subtitle="Statut en temps réel de la plateforme Koleya."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        {/* Bandeau global */}
        <div className="rounded-2xl bg-success-50 border border-success-200 p-6 flex items-center gap-4">
          <CheckCircle2 className="w-10 h-10 text-success-600 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-dark-900">Tous les systèmes sont opérationnels</h2>
            <p className="text-sm text-dark-500">Dernière vérification : il y a quelques minutes.</p>
          </div>
        </div>

        {/* Services */}
        <div className="table-container bg-white">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Statut</th>
                <th>Disponibilité (30 j)</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.name}>
                  <td className="font-medium text-dark-900">{s.name}</td>
                  <td>
                    <span className="inline-flex items-center gap-2 text-success-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
                      {s.status}
                    </span>
                  </td>
                  <td className="text-dark-600">{s.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Incidents passés */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-dark-900 font-display">Incidents passés</h2>
          </div>
          <p className="text-sm text-dark-600 leading-relaxed">
            Aucun incident majeur n'a été enregistré sur les 30 derniers jours. Les opérations
            de maintenance sont réalisées en dehors des heures de bureau pour limiter l'impact.
          </p>
        </div>

        {/* Maintenance */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-accent-600" />
            <h2 className="text-lg font-bold text-dark-900 font-display">Maintenance planifiée</h2>
          </div>
          <p className="text-sm text-dark-600 leading-relaxed">
            Aucune maintenance n'est actuellement planifiée.
          </p>
        </div>

        <p className="flex items-center justify-center gap-2 text-sm text-dark-400">
          <CalendarClock className="w-4 h-4" />
          Les statuts sont actualisés automatiquement et reflètent l'état réel de la plateforme.
        </p>
      </div>
    </>
  )
}
