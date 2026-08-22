// Client API spécifique Module RH — importe apiRequest depuis ./api
import { apiRequest } from './api'

// =============================================
// DOCUMENTS RH
// =============================================
export const documentsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/rh/documents${qs ? '?' + qs : ''}`)
  },
  get: (id) => apiRequest(`/rh/documents/${id}`),
  create: (data) => apiRequest('/rh/documents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/rh/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/rh/documents/${id}`, { method: 'DELETE' }),
  generer: (id) => apiRequest(`/rh/documents/${id}/generer`, { method: 'POST' }),
}

// =============================================
// MISSIONS (ordres de mission)
// =============================================
export const missionsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/rh/missions${qs ? '?' + qs : ''}`)
  },
  get: (id) => apiRequest(`/rh/missions/${id}`),
  create: (data) => apiRequest('/rh/missions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/rh/missions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/rh/missions/${id}`, { method: 'DELETE' }),
  approuver: (id) => apiRequest(`/rh/missions/${id}`, { method: 'PUT', body: JSON.stringify({ statut: 'approuvee', approuver: true }) }),
}

// =============================================
// NOTES DE FRAIS
// =============================================
export const notesFraisAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/rh/notes-frais${qs ? '?' + qs : ''}`)
  },
  get: (id) => apiRequest(`/rh/notes-frais/${id}`),
  create: (data) => apiRequest('/rh/notes-frais', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/rh/notes-frais/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/rh/notes-frais/${id}`, { method: 'DELETE' }),
  approuver: (id) => apiRequest(`/rh/notes-frais/${id}`, { method: 'PUT', body: JSON.stringify({ statut: 'approuvee', approuver: true }) }),
}

// =============================================
// VISITES MÉDICALES
// =============================================
export const visitesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/rh/visites${qs ? '?' + qs : ''}`)
  },
  get: (id) => apiRequest(`/rh/visites/${id}`),
  create: (data) => apiRequest('/rh/visites', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/rh/visites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/rh/visites/${id}`, { method: 'DELETE' }),
}

// =============================================
// MATÉRIEL EMPLOYÉ
// =============================================
export const materielAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/rh/materiel${qs ? '?' + qs : ''}`)
  },
  get: (id) => apiRequest(`/rh/materiel/${id}`),
  create: (data) => apiRequest('/rh/materiel', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/rh/materiel/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/rh/materiel/${id}`, { method: 'DELETE' }),
}

// =============================================
// HISTORIQUE DE PAIE
// =============================================
export const historiquePaieAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/rh/historique-paie${qs ? '?' + qs : ''}`)
  },
}

// =============================================
// STATS RH
// =============================================
export const rhStatsAPI = {
  get: () => apiRequest('/rh'),
}

// =============================================
// OBJET PRINCIPAL
// =============================================
export const rhAPI = {
  documents: documentsAPI,
  missions: missionsAPI,
  notesFrais: notesFraisAPI,
  visites: visitesAPI,
  materiel: materielAPI,
  historiquePaie: historiquePaieAPI,
  stats: rhStatsAPI,
}

export default rhAPI