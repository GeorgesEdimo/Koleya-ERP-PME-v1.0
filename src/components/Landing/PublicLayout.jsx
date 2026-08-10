import React from 'react'
import { Link } from 'react-router-dom'
import { Receipt, ArrowLeft } from 'lucide-react'
import Footer from './Footer'

export function PageIntro({ title, subtitle, badge }) {
  return (
    <div className="bg-gradient-to-b from-primary-50/60 to-white border-b border-dark-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-primary-600 transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        {badge && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
            {badge}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-dark-900 font-display">{title}</h1>
        {subtitle && <p className="mt-3 text-lg text-dark-500 max-w-2xl mx-auto">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-dark-900 font-display">Koleya</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/#fonctionnalites" className="text-sm text-dark-600 hover:text-primary-600 transition-colors">Fonctionnalités</Link>
              <Link to="/#tarifs" className="text-sm text-dark-600 hover:text-primary-600 transition-colors">Tarifs</Link>
              <Link to="/#faq" className="text-sm text-dark-600 hover:text-primary-600 transition-colors">FAQ</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-dark-700 hover:text-primary-600 transition-colors">
                Connexion
              </Link>
              <Link to="/signup" className="btn-primary text-sm">
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  )
}
