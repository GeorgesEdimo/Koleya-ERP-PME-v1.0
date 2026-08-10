// En production, l'app est servie par Nginx en même origine → '/api'.
// En dev, VITE_API_URL (fichier .env) pointe vers http://localhost:3001/api.
const API_BASE = import.meta.env.VITE_API_URL || '/api'

let accessToken = null
let refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('koleya_refresh_token') : null

function setTokens(access, refresh) {
  accessToken = access
  refreshToken = refresh
  if (typeof localStorage !== 'undefined') {
    if (refresh) localStorage.setItem('koleya_refresh_token', refresh)
    else localStorage.removeItem('koleya_refresh_token')
  }
}

function clearTokens() {
  accessToken = null
  refreshToken = null
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('koleya_refresh_token')
  }
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error('No refresh token')
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) {
    clearTokens()
    throw new Error('Session expiree')
  }
  const data = await res.json()
  accessToken = data.accessToken
  // Rotation du refresh token côté backend
  if (data.refreshToken) refreshToken = data.refreshToken
  return data.accessToken
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  let res = await fetch(url, { ...options, headers })

  // Si token expire, essayer de le rafraîchir
  if (res.status === 401 && refreshToken) {
    try {
      const newToken = await refreshAccessToken()
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(url, { ...options, headers })
    } catch (e) {
      clearTokens()
      window.location.href = '/login'
      throw e
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erreur reseau' }))
    throw new Error(error.error || 'Erreur serveur')
  }

  return res.json()
}

// =============================================
// AUTH
// =============================================
export const authAPI = {
  login: (email, mot_de_passe) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, mot_de_passe }),
    }).then(data => {
      setTokens(data.accessToken, data.refreshToken)
      return data
    }),

  signup: (data) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(data => {
      setTokens(data.accessToken, data.refreshToken)
      return data
    }),

  logout: () => {
    apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {})
    clearTokens()
  },

  me: () => apiRequest('/auth/me'),
}

// =============================================
// CLIENTS
// =============================================
export const clientsAPI = {
  list: () => apiRequest('/clients'),
  get: (id) => apiRequest(`/clients/${id}`),
  create: (data) => apiRequest('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/clients/${id}`, { method: 'DELETE' }),
  importMany: (clients) => apiRequest('/clients/import', { method: 'POST', body: JSON.stringify({ clients }) }),
}

// =============================================
// FACTURES
// =============================================
export const facturesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/factures${qs ? '?' + qs : ''}`)
  },
  get: (id) => apiRequest(`/factures/${id}`),
  create: (data) => apiRequest('/factures', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/factures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/factures/${id}`, { method: 'DELETE' }),
}

// =============================================
// CREDITS
// =============================================
export const creditsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/credits${qs ? '?' + qs : ''}`)
  },
  create: (data) => apiRequest('/credits', { method: 'POST', body: JSON.stringify(data) }),
  payer: (id, data) => apiRequest(`/credits/${id}/paiement`, { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/credits/${id}`, { method: 'DELETE' }),
}

// =============================================
// PRODUITS
// =============================================
export const produitsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/produits${qs ? '?' + qs : ''}`)
  },
  create: (data) => apiRequest('/produits', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/produits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  ajusterStock: (id, quantite) => apiRequest(`/produits/${id}/stock`, { method: 'PUT', body: JSON.stringify({ quantite }) }),
  delete: (id) => apiRequest(`/produits/${id}`, { method: 'DELETE' }),
}

// =============================================
// EMPLOYES
// =============================================
export const employesAPI = {
  list: () => apiRequest('/employes'),
  create: (data) => apiRequest('/employes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/employes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/employes/${id}`, { method: 'DELETE' }),
}

// =============================================
// DEPENSES
// =============================================
export const depensesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/depenses${qs ? '?' + qs : ''}`)
  },
  create: (data) => apiRequest('/depenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/depenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/depenses/${id}`, { method: 'DELETE' }),
}

// =============================================
// STATS
// =============================================
export const statsAPI = {
  dashboard: () => apiRequest('/stats/dashboard'),
  entreprise: () => apiRequest('/stats/entreprise'),
  updateEntreprise: (data) => apiRequest('/stats/entreprise', { method: 'PUT', body: JSON.stringify(data) }),
}

// =============================================
// NOTIFICATIONS
// =============================================
export const notificationsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/notifications${qs ? '?' + qs : ''}`)
  },
  envoyer: (data) => apiRequest('/notifications/envoyer', { method: 'POST', body: JSON.stringify(data) }),
  relancerFacture: (id, canal = 'whatsapp') => apiRequest(`/notifications/relance-facture/${id}`, { method: 'POST', body: JSON.stringify({ canal }) }),
  rappelerCredit: (id, canal = 'whatsapp') => apiRequest(`/notifications/rappel-credit/${id}`, { method: 'POST', body: JSON.stringify({ canal }) }),
  relancesAuto: () => apiRequest('/notifications/relances-auto', { method: 'POST' }),
  delete: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
}

// =============================================
// ABONNEMENT (essai 7 jours / quotas / paiement)
// =============================================
export const abonnementAPI = {
  statut: () => apiRequest('/abonnement'),
  payer: (plan) => apiRequest('/abonnement/payer', { method: 'POST', body: JSON.stringify({ plan }) }),
}

// =============================================
// ADMIN (super admin plateforme : voir + restaurer)
// =============================================
export const adminAPI = {
  entreprises: () => apiRequest('/admin/entreprises'),
  entreprise: (id) => apiRequest(`/admin/entreprises/${id}`),
  ressource: (id, ressource, supprimes) =>
    apiRequest(`/admin/entreprises/${id}/${ressource}${supprimes ? '?supprimes=true' : ''}`),
  restaurer: (table, id) => apiRequest(`/admin/restaurer/${table}/${id}`, { method: 'POST' }),
}

// =============================================
// DOCUMENTS (téléversement de fichiers administratifs)
// =============================================
async function apiDownload(endpoint, filename) {
  const headers = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  let res = await fetch(`${API_BASE}${endpoint}`, { headers })
  if (res.status === 401 && refreshToken) {
    const t = await refreshAccessToken()
    headers['Authorization'] = `Bearer ${t}`
    res = await fetch(`${API_BASE}${endpoint}`, { headers })
  }
  if (!res.ok) throw new Error('Téléchargement impossible')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'document'
  a.click()
  URL.revokeObjectURL(url)
}

export const documentsAPI = {
  list: () => apiRequest('/documents'),
  upload: (nom, type_mime, taille, contenu) =>
    apiRequest('/documents', { method: 'POST', body: JSON.stringify({ nom, type_mime, taille, contenu }) }),
  delete: (id) => apiRequest(`/documents/${id}`, { method: 'DELETE' }),
  download: (id, nom) => apiDownload(`/documents/${id}/contenu`, nom),
}

export { setTokens, clearTokens, apiRequest, apiDownload }
