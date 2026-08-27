// Integration tests for the extended RH (paie, conges, evaluations) routes.
const request = require('supertest')
const app = require('../server')
const sequelize = require('../config/database')
let token, entrepriseId

beforeAll(async () => {
  // 1. Créer une entreprise avec un employé
  const employe = await sequelize.models.employes.create({
    id: 'uuid-employe-test',
    entreprise_id: 'uuid-entreprise-test',
    nom: 'NomTest',
    poste: 'Développeur',
    salaire: 400000,
    statut: 'actif',
    conges_jours: 30,
  })
  // 2. Créer une facturation pour avoir une entreprise avec quota
  const entreprise = await sequelize.models.entreprises.create({
    id: 'uuid-entreprise-test',
    nom: 'Entreprise Test',
    plan: 'essai',
    essai_active: true,
    essai_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    periode_comptage_debut: new Date(),
    dernier_reset_quota: new Date(),
  })
  // 3. Créer un utilisateur et se connecter pour obtenir un token
  const utilisateur = await sequelize.models.utilisateurs.create({
    id: 'uuid-utilisateur-test',
    entreprise_id: 'uuid-entreprise-test',
    email: 'test@example.com',
    mot_de_passe: 'passwordHash', // hash testé
    nom: 'User Test',
    role: 'superviseur',
  })
  // 4. Connecter pour obtenir le token
  const login = await request(app).post('/api/auth/login').send({
    email: 'test@example.com',
    mot_de_passe: 'password',
  })
  token = login.body.accessToken
  entrepriseId = 'uuid-entreprise-test'
})

afterAll(async () => {
  await sequelize.close()
})

describe('RH Étendu API (/api/rh-etendu)', () => {
  const authHeaders = (t) => ({ Authorization: `Bearer ${t}` })

  // -- PAIE --
  describe('POST /paie/calculer', () => {
    it('devrait calculer et stocker un bulletin de paie', async () => {
      const payload = {
        employe_id: 'uuid-employe-test',
        mois: 8,
        annee: 2026,
        salaire_brut: 500000,
        heures_sup: 0,
        primes: 0,
        indemnites: 0,
        avance_acomptes: 0,
        mode_paiement: 'virement',
      }
      const res = await request(app)
        .post('/api/rh-etendu/paie/calculer')
        .set(...authHeaders(token))
        .send(payload)
      expect(res.status).toBe(201)
      expect(res.body.employe_id).toBe(payload.employe_id)
      expect(res.body.salaire_net).toBeDefined()
      expect(res.body.statut).toBe('genere')
    })

    it('devrait échouer pour des données invalides', async () => {
      const payload = { employe_id: 'invalid-uuid', mois: 13 }
      const res = await request(app)
        .post('/api/rh-etendu/paie/calculer')
        .set(...authHeaders(token))
        .send(payload)
      expect([400, 422]).toContain(res.status)
    })
  })

  describe('GET /paie (liste)', () => {
    it('devrait lister les bulletins pour une entreprise', async () => {
      const res = await request(app)
        .get('/api/rh-etendu/paie')
        .set(...authHeaders(token))
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      // Au moins le bulletin créé précédemment
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('devrait filtrer par employe_id', async () => {
      const res = await request(app)
        .get('/api/rh-etendu/paie?employe_id=uuid-employe-test')
        .set(...authHeaders(token))
      expect(res.status).toBe(200)
      expect(res.body.every((b) => b.employe_id === 'uuid-employe-test')).toBe(true)
    })
  })

  // -- CONGÉS --
  describe('POST /conges', () => {
    it('devrait créer une demande de congé', async () => {
      const payload = {
        employe_id: 'uuid-employe-test',
        type_conge: 'annuel',
        date_debut: '2026-09-01',
        date_fin: '2026-09-10',
        nb_jours: 8.5,
        motif: 'Test unitaires',
      }
      const res = await request(app)
        .post('/api/rh-etendu/conges')
        .set(...authHeaders(token))
        .send(payload)
      expect(res.status).toBe(201)
      expect(res.body.type_conge).toBe(payload.type_conge)
      expect(res.body.statut).toBe('en_attente')
    })

    it('devrait rejeter une demande avec des données invalides', async () => {
      const payload = { employe_id: 'invalid' }
      const res = await request(app)
        .post('/api/rh-etendu/conges')
        .set(...authHeaders(token))
        .send(payload)
      expect(res.status).toBe(400)
    })
  })

  describe('GET /conges (liste)', () => {
    it('devrait lister les demandes pour une entreprise', async () => {
      const res = await request(app)
        .get('/api/rh-etendu/conges')
        .set(...authHeaders(token))
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('devrait filtrer par statut', async () => {
      const res = await request(app)
        .get('/api/rh-etendu/conges?statut=en_attente')
        .set(...authHeaders(token))
      expect(res.status).toBe(200)
      expect(res.body.every((c) => c.statut === 'en_attente')).toBe(true)
    })
  })

  describe('PUT /conges/:id/decider', () => {
    it('devrait approuver une demande (workflow complet)', async () => {
      // 1. Créer une demande
      const create = await request(app)
        .post('/api/rh-etendu/conges')
        .set(...authHeaders(token))
        .send({
          employe_id: 'uuid-employe-test',
          type_conge: 'annuel',
          date_debut: '2026-09-01',
          date_fin: '2026-09-10',
          nb_jours: 2,
        })
      expect(create.status).toBe(201)
      const congeId = create.body.id

      // 2. Décider d'approuver
      const decision = await request(app)
        .put(`/api/rh-etendu/conges/${congeId}/decider`)
        .set(...authHeaders(token))
        .send({ statut: 'approuve', commentaire_rh: 'Test approved' })
      expect(decision.status).toBe(200)
      expect(decision.body.statut).toBe('approuve')
      expect(decision.body.approuve_par).toBeDefined()
    })
  })

  // -- ÉVALUATIONS --
  describe('POST /evaluations', () => {
    it('devrait créer une évaluation annuelle', async () => {
      const payload = {
        employe_id: 'uuid-employe-test',
        annee: 2026,
        note_globale: 8.5,
        points_forts: 'Bien',
        axes_amelioration: 'Continuer',
        statut: 'planifie',
      }
      const res = await request(app)
        .post('/api/rh-etendu/evaluations')
        .set(...authHeaders(token))
        .send(payload)
      expect(res.status).toBe(201)
      expect(res.body.annee).toBe(payload.annee)
      expect(res.body.note_globale).toBe(8.5)
    })
  })

  describe('GET /evaluations (liste)', () => {
    it('devrait lister les évaluations', async () => {
      const res = await request(app)
        .get('/api/rh-etendu/evaluations')
        .set(...authHeaders(token))
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })
})