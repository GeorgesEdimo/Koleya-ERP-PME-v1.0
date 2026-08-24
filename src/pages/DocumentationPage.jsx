import React from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Building2, FileText, CreditCard, Package,
  Calculator, Users, Database, ArrowUpRight
} from 'lucide-react'
import { PageIntro } from '../components/Landing/PublicLayout'

const sections = [
  {
    icon: BookOpen,
    number: '1',
    title: 'Démarrage rapide',
    color: 'bg-primary-50 text-primary-600',
    body: [
      'Créez votre compte en quelques minutes, sans carte bancaire.',
      'Renseignez les informations de votre entreprise (nom, adresse, N RCCM).',
      'Ajoutez votre logo et votre cachet pour personnaliser vos documents.',
    ],
    links: [{ to: '/app/parametres', label: 'Aller aux paramètres' }],
  },
  {
    icon: FileText,
    number: '2',
    title: 'Facturation',
    color: 'bg-blue-50 text-blue-600',
    body: [
      'Cliquez sur « Nouvelle facture » et sélectionnez le client.',
      'Ajoutez les articles avec quantité et prix unitaire.',
      "Fixez l'échéance et les notes de bas de page.",
      'Enregistrez puis exportez la facture en PDF (logo et cachet inclus).',
    ],
    links: [{ to: '/app/facturation/nouvelle', label: 'Créer une facture' }],
  },
  {
    icon: FileText,
    number: '3',
    title: 'Devis',
    color: 'bg-indigo-50 text-indigo-600',
    body: [
      'Créez un devis depuis le module Devis ou la facturation.',
      'Envoyez-le à votre client puis convertissez-le en facture en un clic.',
      'Le statut passe automatiquement à « accepté » lors de la conversion.',
    ],
    links: [{ to: '/app/devis', label: 'Ouvrir le module Devis' }],
  },
  {
    icon: CreditCard,
    number: '4',
    title: 'Crédits clients',
    color: 'bg-accent-50 text-accent-600',
    body: [
      'Enregistrez un crédit avec son montant total et son échéance.',
      'Encaissez les paiements partiels : le reste est recalculé automatiquement.',
      'Relancez les clients en retard avec un message SMS prêt à envoyer.',
    ],
    links: [{ to: '/app/credit', label: 'Ouvrir le module Crédit' }],
  },
  {
    icon: Package,
    number: '5',
    title: 'Gestion de stock',
    color: 'bg-success-50 text-success-600',
    body: [
      "Ajoutez des produits avec référence, catégorie et prix d'achat/vente.",
      "Fixez un stock minimum : une alerte s'affiche dès que le seuil est franchi.",
      'Ajustez les quantités pour les entrées et sorties de marchandises.',
    ],
    links: [{ to: '/app/stock', label: 'Ouvrir le module Stock' }],
  },
  {
    icon: Calculator,
    number: '6',
    title: 'Comptabilité',
    color: 'bg-danger-50 text-danger-600',
    body: [
      'Suivez vos dépenses par catégorie (loyer, électricité, transport…).',
      "Visualisez le chiffre d'affaires, les dépenses et le résultat net.",
      'Analysez la répartition de vos dépenses avec le graphique camembert.',
    ],
    links: [{ to: '/app/comptabilite', label: 'Ouvrir le module Comptabilité' }],
  },
  {
    icon: Users,
    number: '7',
    title: 'RH & Paie',
    color: 'bg-purple-50 text-purple-600',
    body: [
      "Ajoutez vos employés avec salaire brut et date d'embauche.",
      'Le net est calculé automatiquement (CNPS 4,2 % et IRPP 10 %).',
      'Générez la fiche de paie PDF pour chaque employé.',
    ],
    links: [{ to: '/app/rh', label: 'Ouvrir le module RH' }],
  },
  {
    icon: Database,
    number: '8',
    title: 'Données & sauvegarde',
    color: 'bg-dark-100 text-dark-600',
    body: [
      'Vos données sont enregistrées localement dans votre navigateur (localStorage).',
      'Exportez une sauvegarde JSON depuis les Paramètres.',
      'Réinitialisez vos données de démonstration quand vous le souhaitez.',
    ],
    links: [{ to: '/app/parametres', label: 'Aller aux paramètres' }],
  },
]

export default function DocumentationPage() {
  return (
    <>
      <PageIntro
        badge="Documentation"
        title="Guide complet de Koleya"
        subtitle="Apprenez à utiliser chaque module de l'ERP, étape par étape."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        {sections.map((s) => (
          <section key={s.number} className="card p-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${s.color}`}>
                  {s.number}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <s.icon className={`w-5 h-5 ${s.color.split(' ')[1]}`} />
                  <h2 className="text-lg font-bold text-dark-900 font-display">{s.title}</h2>
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-dark-600 leading-relaxed text-sm">
                  {s.body.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                {s.links.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="inline-flex items-center gap-1 mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {l.label} <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-dark-900 font-display">Une question demeure ?</h2>
          </div>
          <p className="text-dark-600 leading-relaxed">
            Consultez le centre d’aide, la FAQ, ou contactez notre équipe : nous répondons sous 24 heures ouvrées.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/aide" className="btn-secondary text-sm">Centre d’aide</Link>
            <Link to="/contact" className="btn-primary text-sm">Nous contacter</Link>
          </div>
        </section>
      </div>
    </>
  )
}
