import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ShieldCheck, KeyRound, Loader2, ArrowLeft } from 'lucide-react'

export default function TwoFactorVerify() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verify2FA, loading } = useAuth()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = searchParams.get('token')

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await verify2FA(code)
      setSuccess('2FA verifie ! Redirection...')
      setTimeout(() => navigate('/app'), 1000)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Double facteur</h1>
          <p className="text-sm text-primary-200 mt-2">Entrez le code recu par SMS</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-xl text-sm text-success-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> {success}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="input-label">Code de verification</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="123456"
                  maxLength="6"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-dark-400 mt-1">Code a 6 chiffres, valide 5 minutes</p>
            </div>

            <button type="submit" disabled={loading || code.length < 6} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verifier'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => navigate('/login')} className="text-sm text-dark-500 hover:text-dark-700">
              Retour a la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
