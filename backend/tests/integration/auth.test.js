/**
 * Tests d'integration — Authentification
 * Ces tests necessitent une BDD PostgreSQL connectee
 * Lancer avec : npm test -- --run --testPathPattern=auth
 */

const request = require('supertest')
const app = require('../src/server')

describe('API Auth — Integration', () => {
  let accessToken = ''
  let refreshToken = ''

  // =============================================
  // SIGNUP
  // =============================================
  describe('POST /api/auth/signup', () => {
    it('cree un nouvel utilisateur', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: `test_${Date.now()}@koleya.com`,
          mot_de_passe: 'Test12345!',
          nom: 'Test User',
          telephone: '+237699000000',
          entreprise_nom: 'Test Entreprise',
        })

      expect(res.status).toBe(201)
      expect(res.body.user).toBeDefined()
      expect(res.body.user.email).toContain('@koleya.com')
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
      accessToken = res.body.accessToken
      refreshToken = res.body.refreshToken
    })

    it('rejette un email deja utilise', async () => {
      const email = `duplicate_${Date.now()}@koleya.com`

      // Premier enregistrement
      await request(app)
        .post('/api/auth/signup')
        .send({ email, mot_de_passe: 'Test12345!', nom: 'Test' })

      // Deuxieme enregistrement
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email, mot_de_passe: 'Test12345!', nom: 'Test 2' })

      expect(res.status).toBe(409)
    })

    it('rejette un mot de passe trop court', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: `short_${Date.now()}@koleya.com`,
          mot_de_passe: '123',
          nom: 'Test',
        })

      expect(res.status).toBe(400)
    })
  })

  // =============================================
  // LOGIN
  // =============================================
  describe('POST /api/auth/login', () => {
    let testEmail = `login_${Date.now()}@koleya.com`

    beforeAll(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, mot_de_passe: 'Test12345!', nom: 'Login Test' })
    })

    it('connecte avec les bons identifiants', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, mot_de_passe: 'Test12345!' })

      expect(res.status).toBe(200)
      expect(res.body.user).toBeDefined()
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.user.email).toBe(testEmail)
    })

    it('rejette les mauvais identifiants', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, mot_de_passe: 'MauvaisMotDePasse' })

      expect(res.status).toBe(401)
    })

    it('rejette un email inexistant', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inexistant@test.com', mot_de_passe: 'Test12345!' })

      expect(res.status).toBe(401)
    })
  })

  // =============================================
  // ME (profil)
  // =============================================
  describe('GET /api/auth/me', () => {
    it('retourne le profil avec un token valide', async () => {
      if (!accessToken) return // Skip si le signup a echoue

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.user).toBeDefined()
      expect(res.body.user.email).toBeDefined()
    })

    it('rejette sans token', async () => {
      const res = await request(app)
        .get('/api/auth/me')

      expect(res.status).toBe(401)
    })

    it('rejette avec un token invalide', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalide_123')

      expect(res.status).toBe(401)
    })
  })

  // =============================================
  // REFRESH
  // =============================================
  describe('POST /api/auth/refresh', () => {
    it('genere un nouveau access token', async () => {
      if (!refreshToken) return

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })

      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.accessToken).not.toBe(accessToken)
    })

    it('rejette un refresh token invalide', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'token_invalide' })

      expect(res.status).toBe(401)
    })
  })

  // =============================================
  // LOGOUT
  // =============================================
  describe('POST /api/auth/logout', () => {
    it('deconnecte correctement', async () => {
      if (!accessToken) return

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
    })
  })
})
