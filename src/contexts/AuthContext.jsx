import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext()

const SESSION_KEY = 'koleya_session'

function loadSession() {
  try {
    const saved = localStorage.getItem(SESSION_KEY)
    return saved ? JSON.parse(saved) : null
  } catch (e) { /* ignore */ }
  return null
}

function saveSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch (e) { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (loadSession()?.user) || null)
  const [entreprise, setEntreprise] = useState(() => (loadSession()?.entreprise) || null)
  const [loading, setLoading] = useState(false)

  // À la reprise de session, on rafraîchit le profil via le backend
  useEffect(() => {
    if (user) {
      authAPI.me().then((d) => {
        setUser(d.user)
        saveSession({ user: d.user, entreprise })
      }).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email, mot_de_passe) => {
    setLoading(true)
    try {
      const data = await authAPI.login(email, mot_de_passe)
      setUser(data.user)
      setEntreprise(data.entreprise)
      saveSession({ user: data.user, entreprise: data.entreprise })
      return data
    } finally {
      setLoading(false)
    }
  }

  // Le backend s'attend à { email, mot_de_passe, nom, telephone, entreprise_nom }
  const signup = async (data) => {
    setLoading(true)
    try {
      const payload = {
        email: data.email,
        nom: data.nom,
        mot_de_passe: data.password,
        telephone: data.telephone,
        entreprise_nom: data.entreprise,
      }
      const result = await authAPI.signup(payload)
      setUser(result.user)
      setEntreprise(result.entreprise)
      saveSession({ user: result.user, entreprise: result.entreprise })
      return result
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
    setEntreprise(null)
    saveSession(null)
  }

  // Les endpoints SMS / réinitialisation ne sont pas encore exposés par le backend.
  const loginBySMS = () =>
    Promise.reject(new Error('Connexion SMS non disponible. Utilisez votre email.'))
  const verifySMS = () =>
    Promise.reject(new Error('Vérification SMS non disponible.'))
  const resetPassword = () =>
    Promise.reject(new Error('Réinitialisation de mot de passe non disponible. Contactez le support.'))

  const value = {
    user,
    entreprise,
    loading,
    login,
    loginBySMS,
    verifySMS,
    signup,
    logout,
    resetPassword,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
