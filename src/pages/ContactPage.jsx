import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, MessageCircle } from 'lucide-react'
import { PageIntro } from '../components/Landing/PublicLayout'

const infos = [
  { icon: Mail, label: 'Email', value: 'support@koleya.cm' },
  { icon: Phone, label: 'Téléphone / WhatsApp', value: '+237 6XX XXX XXX' },
  { icon: MapPin, label: 'Adresse', value: 'Douala, Cameroun' },
  { icon: Clock, label: 'Horaires', value: 'Lundi – Vendredi, 8h – 18h' },
]

export default function ContactPage() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: 'Support', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <PageIntro
        badge="Support"
        title="Contactez-nous"
        subtitle="Notre équipe vous répond sous 24 heures ouvrées."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Coordonnées */}
          <div className="lg:col-span-2 space-y-4">
            {infos.map((info) => (
              <div key={info.label} className="card p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <info.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-dark-400 font-medium uppercase tracking-wide">{info.label}</p>
                  <p className="text-dark-900 font-medium mt-0.5">{info.value}</p>
                </div>
              </div>
            ))}
            <div className="card p-5 flex items-start gap-4 bg-accent-50/40 border-accent-100">
              <MessageCircle className="w-5 h-5 text-accent-600 mt-1 flex-shrink-0" />
              <p className="text-sm text-dark-600">
                Pour des questions sur les offres ou la facturation, consultez d’abord la{' '}
                <Link to="/#faq" className="text-accent-600 hover:underline font-medium">FAQ</Link>.
              </p>
            </div>
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              {sent ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-14 h-14 text-success-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-dark-900 font-display">Message envoyé !</h2>
                  <p className="text-dark-500 mt-2">
                    Merci {form.nom || 'pour votre message'}. Notre équipe vous répondra sous
                    24 heures ouvrées à l’adresse {form.email || 'indiquée'}.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ nom: '', email: '', sujet: 'Support', message: '' }) }}
                    className="btn-secondary mt-6"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-bold text-dark-900 font-display">Envoyez-nous un message</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Nom complet</label>
                      <input
                        className="input"
                        value={form.nom}
                        onChange={(e) => setForm({ ...form, nom: e.target.value })}
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    <div>
                      <label className="input-label">Email</label>
                      <input
                        className="input"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="vous@entreprise.cm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Sujet</label>
                    <select
                      className="input"
                      value={form.sujet}
                      onChange={(e) => setForm({ ...form, sujet: e.target.value })}
                    >
                      <option>Support</option>
                      <option>Facturation</option>
                      <option>Devis / Partenariat</option>
                      <option>Paiement</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Message</label>
                    <textarea
                      className="input min-h-[140px]"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Décrivez votre demande…"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    <Send className="w-4 h-4" />
                    Envoyer le message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
