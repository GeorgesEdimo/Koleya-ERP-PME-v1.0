import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqItems = [
  {
    q: 'Qu\'est-ce que Koleya ?',
    a: 'Koleya est un ERP en ligne conçu pour les PME camerounaises. Il regroupe la facturation, les devis, les crédits clients, la gestion de stock, la comptabilité et les ressources humaines dans un seul outil, en FCFA et en français.',
  },
  {
    q: 'L\'essai gratuit est-il vraiment gratuit ?',
    a: 'Oui. L\'essai de 14 jours est entièrement gratuit et ne nécessite aucune carte bancaire. À l\'issue de la période, vous choisissez le plan qui vous convient ou vous arrêtez simplement d\'utiliser le service.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui. Dans la version actuelle, vos données sont enregistrées localement dans votre navigateur et restent sur votre appareil. Vous pouvez exporter une sauvegarde JSON à tout moment depuis les Paramètres.',
  },
  {
    q: 'Comment fonctionne le paiement Mobile Money ?',
    a: 'L\'intégration Mobile Money (MTN MoMo et Orange Money) est prévue pour les prochaines versions. Vous pouvez dès aujourd\'hui enregistrer les paiements reçus par Mobile Money sur vos factures et crédits, puis les suivre dans le tableau de bord.',
  },
  {
    q: 'Puis-je utiliser Koleya sur mon téléphone ?',
    a: 'Oui. L\'interface est pensée mobile-first et fonctionne sur tous les téléphones, même avec une connexion limitée. Un mode hors ligne est également prévu pour les zones sans internet.',
  },
  {
    q: 'Puis-je annuler mon abonnement à tout moment ?',
    a: 'Oui. Les offres sont sans engagement : vous pouvez résilier à tout moment et l\'accès reste actif jusqu\'à la fin de la période déjà payée.',
  },
  {
    q: 'Puis-je exporter mes factures en PDF ?',
    a: 'Oui. Chaque facture et chaque devis peut être exporté en PDF professionnel, avec le logo et le cachet de votre entreprise.',
  },
  {
    q: 'Comment fonctionne le support ?',
    a: 'Notre équipe basée à Douala répond par email sous 24 heures ouvrées. Les guides, la documentation et la FAQ sont disponibles en permanence pour vous aider.',
  },
  {
    q: 'Combien d\'utilisateurs peuvent utiliser le compte ?',
    a: 'Cela dépend du plan choisi : 1 utilisateur sur le plan Starter, 3 sur le plan Pro et un nombre illimité sur le plan Business.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-900 font-display">
            Questions fréquentes
          </h2>
          <p className="mt-4 text-lg text-dark-500">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
                aria-expanded={open === i}
              >
                <span className="font-medium text-dark-900">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-dark-400 flex-shrink-0 transition-transform duration-200 ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-dark-600 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
