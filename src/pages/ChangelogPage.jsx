import React from 'react'
import { Sparkles, Rocket, Layers, Clock } from 'lucide-react'
import { PageIntro } from '../components/Landing/PublicLayout'

const versions = [
  {
    version: 'v1.0.0',
    date: '15 janvier 2026',
    title: 'Lancement officiel',
    icon: Rocket,
    items: [
      'Facturation : création, échéances, paiements et export PDF avec logo et cachet.',
      'Module Devis : création, envoi et conversion en facture en un clic.',
      'Crédits clients : suivi des dettes, paiements partiels et relances.',
      'Gestion de stock : produits, catégories, alertes de rupture et ajustements.',
      'Comptabilité : dépenses, bilan, CA et résultat net.',
      'RH & Paie : employés, calcul CNPS/IRPP et fiche de paie PDF.',
      'Authentification par email ou SMS avec code de vérification.',
    ],
  },
  {
    version: 'v0.9.0',
    date: 'décembre 2025',
    title: 'Bêta privée',
    icon: Layers,
    items: [
      'Test de la facturation et des devis auprès de 20 PME pilotes à Douala.',
      'Retours intégrés : export PDF, comptabilité simplifiée et interface mobile.',
    ],
  },
  {
    version: 'v0.8.0',
    date: 'novembre 2025',
    title: 'Prototype',
    icon: Sparkles,
    items: [
      'Maquettes validées avec des gérants de PME locales.',
      'Première version fonctionnelle de la facturation.',
    ],
  },
]

const roadmap = [
  'Relances automatiques par SMS et WhatsApp',
  'Paiement Mobile Money intégré (MTN MoMo et Orange Money)',
  'Multi-succursales',
  'Rapports financiers avancés',
  'Application mobile native',
]

export default function ChangelogPage() {
  return (
    <>
      <PageIntro
        badge="Évolutions du produit"
        title="Changelog"
        subtitle="Suivez les nouveautés, améliorations et correctifs de Koleya."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Timeline */}
        <div className="space-y-8">
          {versions.map((v) => (
            <div key={v.version} className="relative pl-8 border-l-2 border-primary-100">
              <div className="absolute -left-[9px] top-1 w-4 h-4 bg-primary-600 rounded-full border-4 border-primary-100" />
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-dark-900 font-display">{v.version}</h2>
                <span className="badge bg-primary-50 text-primary-700">{v.title}</span>
                <span className="text-sm text-dark-400">{v.date}</span>
              </div>
              <ul className="mt-3 space-y-1.5 list-disc list-inside text-dark-600 leading-relaxed">
                {v.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Roadmap */}
        <div className="mt-14 card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-accent-600" />
            <h2 className="text-lg font-bold text-dark-900 font-display">À venir</h2>
          </div>
          <ul className="space-y-2 text-dark-600 leading-relaxed">
            {roadmap.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-accent-600 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-dark-500 mt-4">
            Ces fonctionnalités sont en cours de développement. Une date de disponibilité sera
            annoncée sur cette page dès qu’elle sera confirmée.
          </p>
        </div>
      </div>
    </>
  )
}
