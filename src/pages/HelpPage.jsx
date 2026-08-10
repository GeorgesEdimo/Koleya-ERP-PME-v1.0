import React from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, FileText, CreditCard, Package, Calculator,
  Users, Settings, Search, HelpCircle
} from 'lucide-react'
import { PageIntro } from '../components/Landing/PublicLayout'

const categories = [
  {
    icon: BookOpen,
    title: 'Prise en main',
    color: 'bg-primary-50 text-primary-600',
    desc: 'Créer un compte, configurer votre entreprise, ajouter votre logo et votre cachet.',
  },
  {
    icon: FileText,
    title: 'Facturation & Devis',
    color: 'bg-blue-50 text-blue-600',
    desc: 'Créer une facture, fixer une échéance, exporter en PDF, convertir un devis.',
  },
  {
    icon: CreditCard,
    title: 'Crédits & relances',
    color: 'bg-accent-50 text-accent-600',
    desc: 'Enregistrer un crédit client, encaisser un paiement partiel, relancer les impayés.',
  },
  {
    icon: Package,
    title: 'Gestion de stock',
    color: 'bg-success-50 text-success-600',
    desc: "Ajouter des produits, fixer des seuils d'alerte et ajuster les quantités.",
  },
  {
    icon: Calculator,
    title: 'Comptabilité',
    color: 'bg-danger-50 text-danger-600',
    desc: "Suivre vos dépenses, analyser votre chiffre d'affaires et votre résultat net.",
  },
  {
    icon: Users,
    title: 'RH & Paie',
    color: 'bg-purple-50 text-purple-600',
    desc: 'Gérer vos employés, calculer CNPS et IRPP, générer les fiches de paie.',
  },
]

export default function HelpPage() {
  return (
    <>
      <PageIntro
        badge="Support"
        title="Centre d'aide"
        subtitle="Trouvez des réponses à vos questions et apprenez à tirer le meilleur de Koleya."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        {/* Recherche */}
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-5 h-5 text-dark-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher dans l'aide… (ex. : facture, crédit, PDF)"
              className="input pl-12"
            />
          </div>
        </div>

        {/* Catégories */}
        <div>
          <h2 className="text-2xl font-bold text-dark-900 font-display mb-6">Parcourir par catégorie</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <Link key={c.title} to="/documentation" className="card-hover p-5 group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color} mb-3`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-dark-900">{c.title}</h3>
                <p className="text-sm text-dark-500 mt-1 leading-relaxed">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Liens rapides */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-dark-900 font-display">Vous ne trouvez pas ?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/#faq" className="flex items-center justify-between card-hover p-4 text-sm font-medium text-dark-700">
              Consulter la FAQ
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/contact" className="flex items-center justify-between card-hover p-4 text-sm font-medium text-dark-700">
              Contacter le support
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/documentation" className="flex items-center justify-between card-hover p-4 text-sm font-medium text-dark-700 sm:col-span-2">
              Lire la documentation complète
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="text-sm text-dark-500 mt-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Une question sur vos paramètres ? Retrouvez toutes les réponses dans la documentation.
          </p>
        </div>
      </div>
    </>
  )
}
