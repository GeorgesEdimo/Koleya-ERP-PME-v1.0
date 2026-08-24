import React from 'react'
import { Link } from 'react-router-dom'
import { Receipt } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-dark-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white font-display">Koleya</span>
            </div>
            <p className="text-sm leading-relaxed">
              L’ERP simplifié pour les PME camerounaises.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
              <li><Link to="/#tarifs" className="hover:text-white transition-colors">Tarifs</Link></li>
              <li><Link to="/api" className="hover:text-white transition-colors">API</Link></li>
              <li><Link to="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/aide" className="hover:text-white transition-colors">Centre d’aide</Link></li>
              <li><Link to="/documentation" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/status" className="hover:text-white transition-colors">Status</Link></li>
              <li><Link to="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link></li>
              <li><Link to="/conditions" className="hover:text-white transition-colors">Conditions</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">2026 Koleya. Tous droits réservés.</p>
          <p className="text-sm">Douala, Cameroun</p>
        </div>
      </div>
    </footer>
  )
}
