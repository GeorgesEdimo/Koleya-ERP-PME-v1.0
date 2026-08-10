import React from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Terminal, Rocket, ShieldCheck } from 'lucide-react'
import { PageIntro } from '../components/Landing/PublicLayout'

const endpoints = [
  { method: 'GET', path: '/api/v1/factures', desc: 'Liste des factures (paginée)' },
  { method: 'POST', path: '/api/v1/factures', desc: 'Créer une facture' },
  { method: 'GET', path: '/api/v1/factures/{id}', desc: "Détail d'une facture" },
  { method: 'POST', path: '/api/v1/factures/{id}/paiements', desc: 'Enregistrer un paiement' },
  { method: 'GET', path: '/api/v1/devis', desc: 'Liste des devis' },
  { method: 'GET', path: '/api/v1/clients', desc: 'Liste des clients' },
  { method: 'GET', path: '/api/v1/produits', desc: 'Liste des produits' },
  { method: 'GET', path: '/api/v1/credits', desc: 'Liste des crédits clients' },
]

const methodColors = {
  GET: 'bg-primary-50 text-primary-700',
  POST: 'bg-success-50 text-success-700',
}

export default function ApiPage() {
  return (
    <>
      <PageIntro
        badge="API & Intégrations"
        title="API Koleya"
        subtitle="Intégrez la facturation et la gestion commerciale directement dans vos outils métiers."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        {/* Vue d'ensemble */}
        <section>
          <h2 className="text-2xl font-bold text-dark-900 font-display mb-3">Vue d'ensemble</h2>
          <p className="text-dark-600 leading-relaxed">
            L'API Koleya permet de créer, lire et mettre à jour vos factures, devis, clients,
            produits et crédits à partir de vos applications. Elle est accessible en HTTPS,
            renvoie des réponses au format JSON et utilise les conventions REST classiques.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <Terminal className="w-6 h-6 text-primary-600 mb-3" />
              <h3 className="font-semibold text-dark-900">Simple</h3>
              <p className="text-sm text-dark-500 mt-1">Des endpoints clairs et une documentation exhaustive.</p>
            </div>
            <div className="card p-5">
              <ShieldCheck className="w-6 h-6 text-success-600 mb-3" />
              <h3 className="font-semibold text-dark-900">Sécurisée</h3>
              <p className="text-sm text-dark-500 mt-1">Connexion chiffrée TLS et authentification par clé API.</p>
            </div>
            <div className="card p-5">
              <Rocket className="w-6 h-6 text-accent-600 mb-3" />
              <h3 className="font-semibold text-dark-900">Fiable</h3>
              <p className="text-sm text-dark-500 mt-1">Disponibilité 99,9 % et gestion des erreurs explicite.</p>
            </div>
          </div>
        </section>

        {/* Authentification */}
        <section>
          <h2 className="text-2xl font-bold text-dark-900 font-display mb-3">Authentification</h2>
          <p className="text-dark-600 leading-relaxed">
            Chaque requête doit être authentifiée avec votre clé API, à transmettre dans l'en-tête
            <code className="bg-dark-50 px-1.5 py-0.5 rounded text-primary-700 text-sm mx-1">Authorization</code>.
            Ne partagez jamais votre clé et utilisez une variable d'environnement côté serveur.
          </p>
          <div className="mt-4 flex items-start gap-3 bg-dark-50 rounded-xl p-4">
            <KeyRound className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-dark-600">
              Les clés API sont disponibles sur le plan <strong>Business</strong>. Elles se
              génèrent depuis les Paramètres de votre compte.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="text-2xl font-bold text-dark-900 font-display mb-3">Endpoints principaux</h2>
          <div className="table-container bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-24">Méthode</th>
                  <th>Endpoint</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((e) => (
                  <tr key={e.method + e.path}>
                    <td>
                      <span className={`badge ${methodColors[e.method]}`}>{e.method}</span>
                    </td>
                    <td className="font-mono text-sm">{e.path}</td>
                    <td className="text-dark-600">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Exemple */}
        <section>
          <h2 className="text-2xl font-bold text-dark-900 font-display mb-3">Exemple de requête</h2>
          <pre className="bg-dark-900 text-green-300 rounded-xl p-5 text-sm overflow-x-auto leading-relaxed">{`curl -X GET \\
  https://api.koleya.cm/api/v1/factures \\
  -H "Authorization: Bearer VOTRE_CLE_API"`}</pre>
          <p className="text-sm text-dark-500 mt-3">
            Toutes les réponses incluent les champs <code className="bg-dark-50 px-1.5 py-0.5 rounded">status</code> et{' '}
            <code className="bg-dark-50 px-1.5 py-0.5 rounded">data</code>. Les erreurs renvoient un code HTTP
            (400, 401, 403, 404, 429, 500) accompagné d'un message explicite.
          </p>
        </section>

        {/* Limites */}
        <section>
          <h2 className="text-2xl font-bold text-dark-900 font-display mb-3">Limites</h2>
          <ul className="list-disc list-inside text-dark-600 leading-relaxed space-y-1.5">
            <li>Limite : 60 requêtes par minute et par clé API.</li>
            <li>Les listes sont paginées par blocs de 50 éléments.</li>
            <li>Les montants sont exprimés en FCFA, au format entier.</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="bg-primary-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold font-display">Prêt à connecter vos outils ?</h2>
          <p className="mt-2 text-primary-100">
            L'accès à l'API est inclus dans le plan Business.
          </p>
          <Link to="/#tarifs" className="inline-block mt-6 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
            Découvrir les tarifs
          </Link>
        </section>
      </div>
    </>
  )
}
