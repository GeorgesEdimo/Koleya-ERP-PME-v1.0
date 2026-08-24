import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FileText, CreditCard, Package, Calculator, Users, Settings,
  Check, ArrowRight, Star, Zap, Shield, Smartphone, BarChart3,
  Receipt, Clock, TrendingUp, Menu, X, ChevronRight, Globe,
  MessageCircle, Banknote, Lock
} from 'lucide-react'
import Faq from './Faq'
import Footer from './Footer'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

const features = [
  {
    icon: FileText,
    title: 'Facturation intelligente',
    desc: 'Créez des factures et devis en quelques clics. Export PDF professionnel avec votre logo et cachet.',
    color: 'bg-primary-50 text-primary-600',
  },
  {
    icon: CreditCard,
    title: 'Suivi des crédits',
    desc: 'Suivez les dettes de vos clients. Rappels automatiques par SMS et WhatsApp.',
    color: 'bg-accent-50 text-accent-600',
  },
  {
    icon: Package,
    title: 'Gestion de stock',
    desc: 'Alertes de rupture, suivi des péremptions, ajustement en temps réel.',
    color: 'bg-success-50 text-success-600',
  },
  {
    icon: Calculator,
    title: 'Comptabilité simplifiée',
    desc: 'Dépenses, bilan, graphiques. Tout votre suivi financier en un coup d\'œil.',
    color: 'bg-danger-50 text-danger-600',
  },
  {
    icon: Users,
    title: 'RH et Paie',
    desc: 'Fiches de paie automatiques, calcul CNPS/IRPP, gestion des congés.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: FileText,
    title: 'Module Devis',
    desc: 'Créez, envoyez et convertissez vos devis en factures en un clic.',
    color: 'bg-blue-50 text-blue-600',
  },
]

const stats = [
  { value: '500+', label: 'PME utilisatrices' },
  { value: '2M+', label: 'FCFA en factures générées' },
  { value: '99.9%', label: 'Disponibilité' },
  { value: '24/7', label: 'Support disponible' },
]

const testimonials = [
  {
    name: 'Ngala Patrick',
    role: 'Gérant, Tech Solutions Douala',
    text: 'Koleya a révolutionné ma gestion. Je passe 2h/semaine au lieu de 10 sur mes factures. Les relances automatiques m\'ont permis de recouvrir 80% de mes impayés.',
    rating: 5,
  },
  {
    name: 'Fotso Marie',
    role: 'Directrice, Boutique Élégance',
    text: 'Le module crédit est une merveille. Avant, je perdais 200 000 FCFA/mois en dettes oubliées. Maintenant, tout est tracé et les rappels se font tout seuls.',
    rating: 5,
  },
  {
    name: 'Kamga Jean-Pierre',
    role: 'PDG, Kamga Import-Export',
    text: 'Enfin un outil adapté au Cameroun. Mobile Money, FCFA, interface en français. C\'est exactement ce dont on avait besoin.',
    rating: 5,
  },
]

const pricing = [
  {
    name: 'Starter',
    price: '5 000',
    period: '/mois',
    desc: 'Pour débuter',
    features: [
      '1 utilisateur',
      '50 factures/mois',
      'Module facturation + devis',
      'Export PDF',
      'Support par email',
    ],
    cta: 'Commencer',
    popular: false,
  },
  {
    name: 'Pro',
    price: '10 000',
    period: '/mois',
    desc: 'Le plus populaire',
    features: [
      '3 utilisateurs',
      'Factures illimitées',
      'Tous les modules',
      'Notifications SMS/WhatsApp',
      'Support prioritaire',
      'Sauvegarde cloud',
    ],
    cta: 'Commencer',
    popular: true,
  },
  {
    name: 'Business',
    price: '20 000',
    period: '/mois',
    desc: 'Pour les équipes',
    features: [
      'Utilisateurs illimités',
      'Tout illimité',
      'Multi-succursales',
      'API et intégrations',
      'Manager dédié',
      'SLA garanti',
    ],
    cta: 'Contacter',
    popular: false,
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showAuth, setShowAuth] = useState(null) // 'login' | 'signup' | null
  const [menuOpen, setMenuOpen] = useState(false)

  // Défilement vers une section ciblée (#faq, #tarifs, #fonctionnalites…)
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    }
  }, [location.pathname, location.hash])

  const handleLogin = (e) => {
    e.preventDefault()
    navigate('/login')
  }

  const handleSignup = (e) => {
    e.preventDefault()
    navigate('/signup')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-dark-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-dark-900 font-display">Koleya</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#fonctionnalites" className="text-sm text-dark-600 hover:text-primary-600 transition-colors">Fonctionnalités</a>
              <a href="#tarifs" className="text-sm text-dark-600 hover:text-primary-600 transition-colors">Tarifs</a>
              <a href="#temoignages" className="text-sm text-dark-600 hover:text-primary-600 transition-colors">Avis</a>
              <button onClick={() => setShowAuth('login')} className="text-sm font-medium text-dark-700 hover:text-primary-600 transition-colors">
                Connexion
              </button>
              <button onClick={() => setShowAuth('signup')} className="btn-primary text-sm">
                Essai gratuit
              </button>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-dark-100">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-dark-100 bg-white px-4 py-4 space-y-3">
            <a href="#fonctionnalites" className="block py-2 text-dark-700">Fonctionnalités</a>
            <a href="#tarifs" className="block py-2 text-dark-700">Tarifs</a>
            <a href="#temoignages" className="block py-2 text-dark-700">Avis</a>
            <hr className="border-dark-100" />
            <button onClick={() => { setShowAuth('login'); setMenuOpen(false) }} className="block w-full text-left py-2 text-dark-700">Connexion</button>
            <button onClick={() => { setShowAuth('signup'); setMenuOpen(false) }} className="btn-primary w-full text-sm">Essai gratuit</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            ERP adapté aux PME camerounaises
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark-900 font-display leading-tight max-w-4xl mx-auto">
            Gérez votre entreprise
            <span className="text-primary-600"> en toute simplicité</span>
          </h1>

          <p className="mt-6 text-lg text-dark-500 max-w-2xl mx-auto leading-relaxed">
            Facturation, devis, crédits clients, stock, comptabilité et RH — tout-en-un.
            Créez des factures pro en 3 clics, suivez vos impayés et générez des rapports en temps réel.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setShowAuth('signup')} className="btn-primary text-base px-8 py-3.5">
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="btn-secondary text-base px-8 py-3.5">
              Voir la démo
            </button>
          </div>

          <p className="mt-4 text-sm text-dark-400">
            Essai gratuit 14 jours — Sans carte bancaire
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-primary-600 font-display">{stat.value}</p>
              <p className="text-sm text-dark-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshot mockup */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-dark-900 rounded-2xl p-2 shadow-2xl">
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="bg-dark-100 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger-400"></div>
                  <div className="w-3 h-3 rounded-full bg-accent-400"></div>
                  <div className="w-3 h-3 rounded-full bg-success-400"></div>
                </div>
                <div className="flex-1 text-center text-xs text-dark-400">app.koleya.cm</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-white p-8 md:p-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-dark-100">
                    <p className="text-xs text-dark-500">CA du mois</p>
                    <p className="text-lg font-bold text-dark-900">1 250 000 FCFA</p>
                    <p className="text-xs text-success-600">+12% par rapport au mois dernier</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-dark-100">
                    <p className="text-xs text-dark-500">Encaisse</p>
                    <p className="text-lg font-bold text-success-600">980 000 FCFA</p>
                    <p className="text-xs text-success-600">78% recouvrement</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-dark-100">
                    <p className="text-xs text-dark-500">Impayés</p>
                    <p className="text-lg font-bold text-danger-600">270 000 FCFA</p>
                    <p className="text-xs text-danger-600">3 clients</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-dark-100">
                    <p className="text-xs text-dark-500">Stock</p>
                    <p className="text-lg font-bold text-primary-600">45 produits</p>
                    <p className="text-xs text-accent-600">2 alertes</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-dark-100 h-32 flex items-end justify-around">
                  {[40, 55, 45, 70, 65, 80, 75, 90].map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-8 bg-primary-500 rounded-t" style={{ height: `${h}%` }}></div>
                      <span className="text-[10px] text-dark-400">{['J','F','M','A','M','J','J','A'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-900 font-display">
              Tout ce dont votre PME a besoin
            </h2>
            <p className="mt-4 text-lg text-dark-500 max-w-2xl mx-auto">
              Un seul outil pour gérer factures, clients, stock, comptabilité et personnel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-hover p-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color} mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-dark-900 mb-2">{f.title}</h3>
                <p className="text-sm text-dark-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi Koleya */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-dark-900 font-display">
                Conçu pour le marché africain
              </h2>
              <p className="mt-6 text-dark-500 leading-relaxed">
                Koleya n’est pas un outil international traduit en français. C’est un ERP
                pensé et développé pour les PME camerounaises et africaines.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  { icon: Banknote, text: 'FCFA et paiement Mobile Money intégré' },
                  { icon: MessageCircle, text: 'Relances par SMS et WhatsApp' },
                  { icon: Smartphone, text: 'Interface mobile-first, compatible tout téléphone' },
                  { icon: Globe, text: '100% en français, support local à Douala' },
                  { icon: Lock, text: 'Données stockées sécurisément' },
                  { icon: Clock, text: 'Mode hors ligne pour zones sans Internet' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <p className="text-dark-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
              <div className="space-y-6">
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                  <p className="text-sm text-primary-200">Facture générée</p>
                  <p className="text-xl font-bold">FAC-2026-047</p>
                  <p className="text-sm text-primary-200 mt-1">Entreprise Kamga — 150 000 FCFA</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                  <p className="text-sm text-primary-200">Paiement reçu</p>
                  <p className="text-xl font-bold text-success-300">+75 000 FCFA</p>
                  <p className="text-sm text-primary-200 mt-1">Via MTN Mobile Money</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                  <p className="text-sm text-primary-200">Alerte stock</p>
                  <p className="text-xl font-bold text-accent-300">3 produits en rupture</p>
                  <p className="text-sm text-primary-200 mt-1">Réapprovisionnement recommandé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Temoignages */}
      <section id="temoignages" className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-900 font-display">
              Ils nous font confiance
            </h2>
            <p className="mt-4 text-lg text-dark-500">
              Plus de 500 PME utilisent Koleya au quotidien
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent-400 text-accent-400" />
                  ))}
                </div>
                <p className="text-dark-600 text-sm leading-relaxed mb-4">« {t.text} »</p>
                <div>
                  <p className="font-semibold text-dark-900 text-sm">{t.name}</p>
                  <p className="text-xs text-dark-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-900 font-display">
              Des tarifs adaptés à votre budget
            </h2>
            <p className="mt-4 text-lg text-dark-500">
              Pas de frais d’installation. Annulez à tout moment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <div key={plan.name} className={`card p-6 relative ${plan.popular ? 'border-2 border-primary-500 shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
                    Populaire
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-dark-900">{plan.name}</h3>
                  <p className="text-xs text-dark-500 mt-1">{plan.desc}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-dark-900 font-display">{plan.price}</span>
                    <span className="text-sm text-dark-500"> FCFA{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-dark-600">
                      <Check className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setShowAuth('signup')}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-dark-100 text-dark-700 hover:bg-dark-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <Faq />

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold font-display">
            Prêt à simplifier la gestion de votre entreprise ?
          </h2>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
            Rejoignez plus de 500 PME qui font confiance à Koleya.
            Essai gratuit 14 jours, sans carte bancaire.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setShowAuth('signup')} className="bg-white text-primary-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-50 transition-colors flex items-center gap-2">
              Créer mon compte gratuit
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="tel:+237600000000" className="border border-white/30 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors">
              Nous contacter
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Modal Auth */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-primary-600 px-6 py-8 text-center text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-display">
                {showAuth === 'login' ? 'Connexion à Koleya' : 'Créer votre compte'}
              </h2>
              <p className="text-sm text-primary-100 mt-1">
                {showAuth === 'login'
                  ? 'Accédez à votre espace de gestion'
                  : 'Essai gratuit 14 jours, sans carte bancaire'}
              </p>
            </div>

            <div className="p-6">
              {showAuth === 'signup' && (
                <div className="mb-4">
                  <label className="input-label">Nom de l’entreprise</label>
                  <input type="text" className="input" placeholder="Ma PME SARL" />
                </div>
              )}
              <div className="mb-4">
                <label className="input-label">Email</label>
                <input type="email" className="input" placeholder="vous@entreprise.com" />
              </div>
              <div className="mb-4">
                <label className="input-label">Mot de passe</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              {showAuth === 'signup' && (
                <div className="mb-4">
                  <label className="input-label">Téléphone</label>
                  <input type="tel" className="input" placeholder="+237 6XX XXX XXX" />
                </div>
              )}

              <button
                onClick={showAuth === 'login' ? handleLogin : handleSignup}
                className="btn-primary w-full py-3 text-base"
              >
                {showAuth === 'login' ? 'Se connecter' : 'Démarrer l\'essai gratuit'}
              </button>

              <p className="text-center text-sm text-dark-500 mt-4">
                {showAuth === 'login' ? (
                  <>Pas encore de compte ?{' '}
                    <button onClick={() => setShowAuth('signup')} className="text-primary-600 font-medium hover:underline">
                      Créer un compte
                    </button>
                  </>
                ) : (
                  <>Déjà un compte ?{' '}
                    <button onClick={() => setShowAuth('login')} className="text-primary-600 font-medium hover:underline">
                      Se connecter
                    </button>
                  </>
                )}
              </p>

              <button onClick={() => setShowAuth(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-dark-100 text-dark-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
