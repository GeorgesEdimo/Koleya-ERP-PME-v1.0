/**
 * Tests d'integration — Clients
 */

const request = require('supertest')
const app = require('../src/server')

describe('API Clients — Integration', () => {
  let token = ''
  let clientId = ''

  beforeAll(async () => {
    // Creer un utilisateur de test
    const email = `client_test_${Date.now()}@koleya.com`
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email, mot_de_passe: 'Test12345!', nom: 'Client Test', entreprise_nom: 'Test' })
    token = res.body.accessToken
  })

  describe('POST /api/clients', () => {
    it('cree un client', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ nom: 'Client Integration Test', telephone: '+237699111222', email: 'client@test.com' })

      expect(res.status).toBe(201)
      expect(res.body.nom).toBe('Client Integration Test')
      expect(res.body.id).toBeDefined()
      clientId = res.body.id
    })

    it('rejette un client sans nom', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ telephone: '+237699333444' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/clients', () => {
    it('retourne la liste des clients', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('PUT /api/clients', () => {
    it('met a jour un client', async () => {
      if (!clientId) return

      const res = await request(app)
        .put('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: clientId, nom: 'Client Modifie', telephone: '+237699555666' })

      expect(res.status).toBe(200)
      expect(res.body.nom).toBe('Client Modifie')
    })
  })

  describe('DELETE /api/clients', () => {
    it('supprime un client', async () => {
      if (!clientId) return

      const res = await request(app)
        .delete(`/api/clients?id=${clientId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
    })
  })
})
