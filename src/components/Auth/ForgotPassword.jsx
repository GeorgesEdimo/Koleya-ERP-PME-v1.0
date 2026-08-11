import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, KeyRound, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { forgotPassword, resetPassword, loading } = useAuth()

  const token = searchParams.get('token')
  const [mode, setMode] = useState(token ? 'reset' : 'request') // request | reset

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRequest = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await forgotPassword(email)
      setSuccess('Si cet email existe, un lien de reinitialisation a ete envoye. Verifiez votre boite mail.')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres')
      return
    }

    try {
      await resetPassword(token, newPassword, smsCode || undefined)
      setSuccess('Mot de passe reinitialise ! Redirection vers la connexion...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">
            {mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe oublie'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-xl text-sm text-success-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}

          {/* Demande de lien */}
          {mode === 'request' && (
            <form onSubmit={handleRequest} className="space-y-4">
              <p className="text-sm text-dark-500">
                Entrez votre email. Nous vous enverrons un lien pour reinitialiser votre mot de passe.
              </p>
              <div>
                <label className="input-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="vous@entreprise.com" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le lien'}
              </button>
            </form>
          )}

          {/* Reinitialisation */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-dark-500">
                Choisissez un nouveau mot de passe. Si vous avez active le 2FA, un code SMS vous sera demande.
              </p>
              <div>
                <label className="input-label">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input pl-10" placeholder="8 caracteres minimum" minLength="8" required />
                </div>
              </div>
              <div>
                <label className="input-label">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10" placeholder="Retapez le mot de passe" minLength="8" required />
                </div>
              </div>
              <div>
                <label className="input-label">Code SMS (si 2FA actif)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value)} className="input pl-10" placeholder="123456" maxLength="6" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reinitialiser'}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button onClick={() => navigate('/login')} className="text-sm text-dark-500 hover:text-dark-700 flex items-center gap-1 mx-auto">
              <ArrowLeft className="w-4 h-4" /> Retour a la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
