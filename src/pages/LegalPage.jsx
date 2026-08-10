import React from 'react'
import { ShieldCheck, ScrollText, Cookie } from 'lucide-react'
import { PageIntro } from '../components/Landing/PublicLayout'

const legalData = {
  confidentialite: {
    icon: ShieldCheck,
    title: "Politique de confidentialité",
    subtitle: "Comment Koleya collecte, utilise et protège vos données.",
    updated: "Dernière mise à jour : 1er août 2026",
    sections: [
      {
        heading: "1. Données collectées",
        body: [
          "Lors de la création de votre compte : nom, adresse email, numéro de téléphone et nom de l'entreprise.",
          "Données de gestion saisies dans l'ERP : clients, factures, devis, crédits, produits, dépenses et employés.",
          "Données techniques : type de navigateur, langue et pages visitées, utilisées uniquement pour améliorer le service.",
        ],
      },
      {
        heading: "2. Utilisation des données",
        body: [
          "Fournir et maintenir les fonctionnalités de l'ERP.",
          "Assurer le support client et répondre à vos demandes.",
          "Améliorer l'expérience utilisateur et la fiabilité du service.",
        ],
      },
      {
        heading: "3. Stockage et sécurité",
        body: [
          "Dans la version actuelle, vos données sont enregistrées localement dans votre navigateur (localStorage) et restent sur votre appareil.",
          "Les accès sont protégés par mot de passe et par connexion chiffrée (TLS) dès qu'un serveur est utilisé.",
          "Vous pouvez exporter une sauvegarde de vos données à tout moment depuis les Paramètres.",
        ],
      },
      {
        heading: "4. Partage des données",
        body: [
          "Koleya ne vend pas et ne loue pas vos données à des tiers.",
          "Vos données ne sont partagées qu'avec votre accord explicite, ou lorsque la loi l'exige.",
        ],
      },
      {
        heading: "5. Vos droits",
        body: [
          "Vous pouvez accéder à vos données, les corriger, les exporter ou demander leur suppression.",
          "Toute demande peut être adressée à support@koleya.cm ; nous répondons sous 30 jours.",
        ],
      },
      {
        heading: "6. Contact",
        body: [
          "Pour toute question relative à la protection de vos données : support@koleya.cm — Douala, Cameroun.",
        ],
      },
    ],
  },
  conditions: {
    icon: ScrollText,
    title: "Conditions générales d'utilisation",
    subtitle: "Les règles qui encadrent l'utilisation de Koleya.",
    updated: "Dernière mise à jour : 1er août 2026",
    sections: [
      {
        heading: "1. Objet",
        body: [
          "Les présentes conditions régissent l'accès et l'utilisation du logiciel Koleya, un ERP destiné aux petites et moyennes entreprises.",
        ],
      },
      {
        heading: "2. Compte et abonnement",
        body: [
          "L'utilisateur s'engage à fournir des informations exactes lors de la création de son compte.",
          "Les offres payantes sont facturées mensuellement, sans engagement de durée.",
          "L'utilisateur est responsable de la confidentialité de son mot de passe.",
        ],
      },
      {
        heading: "3. Essai gratuit",
        body: [
          "Chaque nouvelle entreprise bénéficie d'un essai gratuit de 14 jours, sans carte bancaire.",
          "À l'issue de l'essai, l'accès est suspendu tant qu'un abonnement n'est pas souscrit.",
        ],
      },
      {
        heading: "4. Utilisation du service",
        body: [
          "Koleya est destiné à un usage professionnel et conforme à la loi.",
          "Il est interdit d'utiliser le service pour des activités frauduleuses ou illégales.",
        ],
      },
      {
        heading: "5. Responsabilités",
        body: [
          "Koleya s'efforce de garantir une disponibilité élevée mais ne peut être tenu responsable des interruptions liées à la maintenance ou à des causes externes.",
          "L'utilisateur reste responsable de la vérification de ses données comptables et fiscales.",
        ],
      },
      {
        heading: "6. Résiliation",
        body: [
          "L'utilisateur peut résilier son abonnement à tout moment ; l'accès reste actif jusqu'à la fin de la période payée.",
        ],
      },
      {
        heading: "7. Loi applicable",
        body: [
          "Les présentes conditions sont soumises au droit de la République du Cameroun. Tout litige relève des tribunaux compétents de Douala.",
        ],
      },
      {
        heading: "8. Contact",
        body: [
          "Pour toute question : support@koleya.cm.",
        ],
      },
    ],
  },
  cookies: {
    icon: Cookie,
    title: "Politique de cookies",
    subtitle: "Comprendre l'utilisation des cookies sur Koleya.",
    updated: "Dernière mise à jour : 1er août 2026",
    sections: [
      {
        heading: "1. Qu'est-ce qu'un cookie ?",
        body: [
          "Un cookie est un petit fichier déposé sur votre appareil pour conserver des informations de session et de préférences.",
        ],
      },
      {
        heading: "2. Cookies utilisés",
        body: [
          "Cookies de session : ils mémorisent votre connexion pendant votre visite.",
          "Préférences : langue, format d'affichage et choix de l'interface.",
          "Aucun cookie publicitaire ou de suivi tiers n'est utilisé.",
        ],
      },
      {
        heading: "3. Gestion des cookies",
        body: [
          "Vous pouvez à tout moment désactiver les cookies depuis les réglages de votre navigateur.",
          "Certaines fonctionnalités (connexion automatique) peuvent être altérées si les cookies sont bloqués.",
        ],
      },
      {
        heading: "4. Consentement",
        body: [
          "En continuant à utiliser Koleya, vous acceptez l'utilisation des cookies décrite dans cette page.",
        ],
      },
      {
        heading: "5. Contact",
        body: [
          "Pour toute question relative aux cookies : support@koleya.cm.",
        ],
      },
    ],
  },
}

export default function LegalPage({ type }) {
  const data = legalData[type] || legalData.confidentialite

  return (
    <>
      <PageIntro
        badge="Informations légales"
        title={data.title}
        subtitle={data.subtitle}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <p className="text-sm text-dark-400 mb-8">{data.updated}</p>

        <div className="space-y-8">
          {data.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-bold text-dark-900 font-display mb-2">{s.heading}</h2>
              <ul className="space-y-1.5 list-disc list-inside text-dark-600 leading-relaxed">
                {s.body.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 card p-6 bg-primary-50/40">
          <div className="flex items-start gap-3">
            <data.icon className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
            <p className="text-sm text-dark-600 leading-relaxed">
              Une question sur ce document ? Écrivez-nous à{' '}
              <a href="mailto:support@koleya.cm" className="text-primary-600 font-medium hover:underline">
                support@koleya.cm
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
