/**
 * Tests d'integration — Produits
 */

const request = require('supertest')
const app = require('../../src/server')

describe('API Produits — Integration', () => {
  let token = ''
  let produitId = ''

  beforeAll(async () => {
    const email = `produit_test_${Date.now()}@koleya.com`
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email, mot_de_passe: 'Test12345!', nom: 'Produit Test', entreprise_nom: 'Test' })
    token = res.body.accessToken
  })

  describe('POST /api/produits', () => {
    it('cree un produit', async () => {
      const res = await request(app)
        .post('/api/produits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nom: 'Produit Integration',
          reference: 'REF-TEST-001',
          categorie: 'Fournitures',
          stock: 100,
          stockMin: 10,
          prixAchat: 1500,
          prixVente: 2500,
        })

      expect(res.status).toBe(201)
      expect(res.body.nom).toBe('Produit Integration')
      produitId = res.body.id
    })
  })

  describe('GET /api/produits', () => {
    it('retourne la liste des produits', async () => {
      const res = await request(app)
        .get('/api/produits')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('PUT /api/produits/:id', () => {
    it('met a jour un produit', async () => {
      if (!produitId) return

      const res = await request(app)
        .put(`/api/produits/${produitId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ stock: 150 })

      expect(res.status).toBe(200)
      expect(res.body.stock).toBe(150)
    })
  })

  describe('DELETE /api/produits/:id', () => {
    it('supprime un produit', async () => {
      if (!produitId) return

      const res = await request(app)
        .delete(`/api/produits/${produitId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
    })
  })
})
