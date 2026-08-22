import { apiRequest } from './api'

// =============================================
// RECHERCHE / FILTRES GLOBAUX + ARCHIVAGE / HISTORIQUE
// =============================================
// Toutes les routes sont montées sous /api/recherche (voir backend/src/routes/recherche.js).

export const rechercheAPI = {
  // GET /api/recherche/search?q=&module=&statut=&page=&limit=
  search: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/recherche/search${qs ? '?' + qs : ''}`)
  },

  // GET /api/recherche/archives?module=&type_document=&q=&page=&limit=
  archives: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/recherche/archives${qs ? '?' + qs : ''}`)
  },

  // GET /api/recherche/historique?module=&document_id=&page=&limit=
  historique: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/recherche/historique${qs ? '?' + qs : ''}`)
  },

  // POST /api/recherche/archives
  archiver: (data) =>
    apiRequest('/recherche/archives', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // POST /api/recherche/historique
  enregistrerEvenement: (data) =>
    apiRequest('/recherche/historique', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export default rechercheAPI
