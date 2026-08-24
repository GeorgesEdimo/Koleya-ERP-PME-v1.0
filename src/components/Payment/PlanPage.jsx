import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Crown, CheckCircle2 } from 'lucide-react'
import { useAbonnement } from '../../contexts/AbonnementContext'

const plans = [
  {
    name: 'Starter',
    price: '5 000',
    desc: 'Pour débuter',
    features: ['1 utilisateur', '50 factures/mois', 'Facturation + devis', 'Export PDF', 'Support email'],
  },
  {
    name: 'Pro',
    price: '10 000',
    desc: 'Le plus populaire',
    popular: true,
    features: ['3 utilisateurs', 'Factures illimitées', 'Tous les modules', 'Relances SMS/WhatsApp', 'Support prioritaire'],
  },
  {
    name: 'Business',
    price: '20 000',
    desc: 'Pour les équipes',
    features: ['Utilisateurs illimités', 'Tout illimité', 'API et intégrations', 'Multi-succursales', 'Manager dédié'],
  },
]

export default function PlanPage() {
  const navigate = useNavigate()
  const { abonnement, payer } = useAbonnement()
  const [enCours, setEnCours] = useState(null)
  const [fait, setFait] = useState(false)

  const handlePayer = async (plan) => {
    setEnCours(plan)
    try {
      await payer(plan.toLowerCase())
      setFait(true)
      setTimeout(() => navigate('/app'), 1500)
    } finally {
      setEnCours(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
          <Crown className="w-4 h-4" />
          Abonnement {abonnement?.plan || ''}
        </div>
        <h1 className="page-title">Choisissez votre plan</h1>
        <p className="page-subtitle">
          {abonnement?.statut === 'expire'
            ? 'Votre essai gratuit est terminé. Passez à un plan payant pour continuer à créer, modifier et exporter.'
            : 'Passez à un plan payant quand vous êtes prêt. Les compteurs d\'essai sont remis à zéro à l\'achat.'}
        </p>
      </div>

      {fait && (
        <div className="rounded-2xl bg-success-50 border border-success-200 p-5 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success-600" />
          <p className="text-success-700 font-medium">Paiement effectué — votre plan est actif !</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const actif = abonnement?.plan === plan.name.toLowerCase()
          return (
            <div
              key={plan.name}
              className={`card p-6 relative ${plan.popular ? 'border-2 border-primary-500 shadow-lg scale-[1.02]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
                  Populaire
                </div>
              )}
              <h3 className="text-lg font-semibold text-dark-900">{plan.name}</h3>
              <p className="text-xs text-dark-500 mt-1">{plan.desc}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-dark-900 font-display">{plan.price}</span>
                <span className="text-sm text-dark-500"> FCFA/mois</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-dark-600">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePayer(plan.name)}
                disabled={actif || enCours === plan.name}
                className={`mt-6 w-full py-3 rounded-xl font-medium text-sm transition-colors ${
                  actif
                    ? 'bg-success-50 text-success-700 cursor-default'
                    : plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-dark-100 text-dark-700 hover:bg-dark-200'
                } disabled:opacity-60`}
              >
                {enCours === plan.name ? 'Traitement…' : actif ? 'Plan actuel' : 'Passer à ce plan'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-center text-sm text-dark-400">
        Paiement de démonstration — l’intégration d’un prestataire (Mobile Money, carte) sera ajoutée.
      </p>
    </div>
  )
}
