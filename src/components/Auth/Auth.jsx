import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Receipt, Mail, Lock, Phone, Eye, EyeOff, ArrowLeft,
  CheckCircle, Loader2, MessageCircle, KeyRound, User
} from 'lucide-react'

export default function Auth() {
  const navigate = useNavigate()
  const { login, loginBySMS, verifySMS, signup, resetPassword, loading } = useAuth()

  const [mode, setMode] = useState('login') // login | signup | sms | sms-verify | forgot
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup form
  const [signupNom, setSignupNom] = useState('')
  const [signupEntreprise, setSignupEntreprise] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupTel, setSignupTel] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  // SMS
  const [smsTel, setSmsTel] = useState('')
  const [smsCode, setSmsCode] = useState('')

  // Forgot
  const [forgotEmail, setForgotEmail] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(loginEmail, loginPassword)
      navigate('/app')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signup({
        nom: signupNom,
        entreprise: signupEntreprise,
        email: signupEmail,
        telephone: signupTel,
        password: signupPassword,
      })
      navigate('/app')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSMS = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await loginBySMS(smsTel)
      setSuccess('Code envoyé ! (Démo : 123456)')
      setMode('sms-verify')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleVerifySMS = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await verifySMS(smsTel, smsCode)
      navigate('/app')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await resetPassword(forgotEmail)
      setSuccess('Email de réinitialisation envoyé ! (Simulation)')
      setTimeout(() => setMode('login'), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const resetForms = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <Receipt className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white font-display">Koleya</span>
          </Link>
          <p className="text-primary-200 text-sm mt-2">ERP pour PME camerounaises</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          {mode === 'login' && (
            <div className="flex border-b border-dark-100">
              <button
                onClick={() => { setMode('login'); resetForms() }}
                className="flex-1 py-3 text-sm font-medium text-primary-600 border-b-2 border-primary-600"
              >
                Email
              </button>
              <button
                onClick={() => { setMode('sms'); resetForms() }}
                className="flex-1 py-3 text-sm font-medium text-dark-500 hover:text-dark-700"
              >
                SMS
              </button>
            </div>
          )}

          <div className="p-6">
            {/* Error/Success */}
            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-xl text-sm text-success-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}

            {/* LOGIN EMAIL */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-dark-900 font-display">Connexion</h2>
                  <p className="text-sm text-dark-500 mt-1">Accédez à votre espace de gestion</p>
                </div>

                <div>
                  <label className="input-label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="vous@entreprise.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="input pl-10 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-dark-600">
                    <input type="checkbox" className="rounded border-dark-300" />
                    Se souvenir de moi
                  </label>
                  <button type="button" onClick={() => { setMode('forgot'); resetForms() }} className="text-sm text-primary-600 hover:underline">
                    Mot de passe oublié ?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
                </button>

                <p className="text-center text-sm text-dark-500">
                  Pas encore de compte ?{' '}
                  <button type="button" onClick={() => { setMode('signup'); resetForms() }} className="text-primary-600 font-medium hover:underline">
                    Créer un compte
                  </button>
                </p>

                <div className="text-center text-xs text-dark-400 bg-dark-50 rounded-lg p-3">
                  <strong>Démo :</strong> admin@koleya.com / admin123
                </div>
              </form>
            )}

            {/* LOGIN SMS */}
            {mode === 'sms' && (
              <form onSubmit={handleSMS} className="space-y-4">
                <div>
                  <button type="button" onClick={() => { setMode('login'); resetForms() }} className="flex items-center gap-1 text-sm text-dark-500 hover:text-dark-700 mb-3">
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <h2 className="text-xl font-bold text-dark-900 font-display">Connexion par SMS</h2>
                  <p className="text-sm text-dark-500 mt-1">Recevez un code de vérification par SMS</p>
                </div>

                <div>
                  <label className="input-label">Numéro de téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="tel"
                      value={smsTel}
                      onChange={(e) => setSmsTel(e.target.value)}
                      className="input pl-10"
                      placeholder="+237 6XX XXX XXX"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      Recevoir le code SMS
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-dark-500">
                  Pas encore de compte ?{' '}
                  <button type="button" onClick={() => { setMode('signup'); resetForms() }} className="text-primary-600 font-medium hover:underline">
                    Créer un compte
                  </button>
                </p>
              </form>
            )}

            {/* SMS VERIFY */}
            {mode === 'sms-verify' && (
              <form onSubmit={handleVerifySMS} className="space-y-4">
                <div>
                  <button type="button" onClick={() => { setMode('sms'); resetForms() }} className="flex items-center gap-1 text-sm text-dark-500 hover:text-dark-700 mb-3">
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <h2 className="text-xl font-bold text-dark-900 font-display">Vérifier le code</h2>
                  <p className="text-sm text-dark-500 mt-1">Entrez le code reçu au {smsTel}</p>
                </div>

                <div>
                  <label className="input-label">Code de vérification</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      className="input pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                      placeholder="123456"
                      maxLength="6"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Vérifier et se connecter'}
                </button>
              </form>
            )}

            {/* SIGNUP */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <button type="button" onClick={() => { setMode('login'); resetForms() }} className="flex items-center gap-1 text-sm text-dark-500 hover:text-dark-700 mb-3">
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <h2 className="text-xl font-bold text-dark-900 font-display">Créer un compte</h2>
                  <p className="text-sm text-dark-500 mt-1">Essai gratuit 14 jours, sans carte bancaire</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Votre nom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input type="text" value={signupNom} onChange={(e) => setSignupNom(e.target.value)} className="input pl-10" placeholder="Jean Kamga" required />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Entreprise</label>
                    <input type="text" value={signupEntreprise} onChange={(e) => setSignupEntreprise(e.target.value)} className="input" placeholder="Ma PME SARL" />
                  </div>
                </div>

                <div>
                  <label className="input-label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="input pl-10" placeholder="vous@entreprise.com" required />
                  </div>
                </div>

                <div>
                  <label className="input-label">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input type="tel" value={signupTel} onChange={(e) => setSignupTel(e.target.value)} className="input pl-10" placeholder="+237 6XX XXX XXX" required />
                  </div>
                </div>

                <div>
                  <label className="input-label">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="input pl-10 pr-10"
                      placeholder="8 caractères minimum"
                      minLength="6"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer mon compte'}
                </button>

                <p className="text-center text-sm text-dark-500">
                  Déjà un compte ?{' '}
                  <button type="button" onClick={() => { setMode('login'); resetForms() }} className="text-primary-600 font-medium hover:underline">
                    Se connecter
                  </button>
                </p>
              </form>
            )}

            {/* FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <button type="button" onClick={() => { setMode('login'); resetForms() }} className="flex items-center gap-1 text-sm text-dark-500 hover:text-dark-700 mb-3">
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <h2 className="text-xl font-bold text-dark-900 font-display">Mot de passe oublié</h2>
                  <p className="text-sm text-dark-500 mt-1">Entrez votre email pour recevoir un lien de réinitialisation</p>
                </div>

                <div>
                  <label className="input-label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="input pl-10" placeholder="vous@entreprise.com" required />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le lien'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Back to home */}
        <p className="text-center text-sm text-primary-200 mt-6">
          <Link to="/" className="hover:text-white transition-colors">
            Retour à la page d'accueil
          </Link>
        </p>
      </div>
    </div>
  )
}
