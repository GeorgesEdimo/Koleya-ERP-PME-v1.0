// =============================================
// Koleya — Test API complet (essai 7j, quotas, super admin)
// Usage : node scripts/test-api.js [API_BASE]
// Prérequis : backend démarré (défaut http://localhost:3001/api ;
//             pour tester la stack Docker : API_BASE=http://localhost:8080/api)
// =============================================
const BASE = process.env.API_BASE || 'http://localhost:3001/api'

let total = 0
let ok = 0

function assert(cond, label, detail = '') {
  total++
  if (cond) { ok++; console.log(`  ✅ ${label}`) }
  else { console.log(`  ❌ ${label} ${detail}`) }
}

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function main() {
  console.log('\n=== 1. Santé du serveur ===')
  const health = await req('GET', '/health')
  assert(health.status === 200, 'GET /api/health → 200', `(${health.status})`)
  assert(health.data?.status === 'ok' || health.data?.ok === true, 'Réponse ok', JSON.stringify(health.data))

  console.log('\n=== 2. Inscription (essai 7 jours) ===')
  const email = `test${Date.now()}@koleya.cm`
  const signup = await req('POST', '/auth/signup', {
    email, mot_de_passe: 'password123', nom: 'Testeur', telephone: '699111222', entreprise_nom: 'Test SARL',
  })
  assert(signup.status === 201, 'POST /auth/signup → 201', `(${signup.status}) ${JSON.stringify(signup.data)}`)
  assert(!!signup.data?.user?.entreprise_id, 'user.entreprise_id présent')
  assert(!!signup.data?.accessToken && !!signup.data?.refreshToken, 'Tokens JWT + refresh émis')
  const entId = signup.data?.user?.entreprise_id
  const token = signup.data?.accessToken

  if (signup.data?.entreprise?.essai_fin) {
    const jours = Math.round((new Date(signup.data.entreprise.essai_fin) - Date.now()) / 86400000)
    assert(jours >= 6 && jours <= 7, `Essai = J+${jours} jours`, `(essai_fin=${signup.data.entreprise.essai_fin})`)
  } else {
    assert(false, 'essai_fin renvoyé à l’inscription')
  }

  console.log('\n=== 3. Connexion ===')
  const login = await req('POST', '/auth/login', { email, mot_de_passe: 'password123' })
  assert(login.status === 200, 'POST /auth/login → 200', `(${login.status})`)
  assert(!!login.data?.accessToken, 'accessToken émis')
  const t2 = login.data?.accessToken

  console.log('\n=== 3bis. Compte démo seedé (admin@koleya.com) ===')
  const demo = await req('POST', '/auth/login', { email: 'admin@koleya.com', mot_de_passe: 'admin123' })
  assert(demo.status === 200, 'Login admin@koleya.com / admin123 → 200', `(${demo.status}) ${JSON.stringify(demo.data).slice(0, 120)}`)

  console.log('\n=== 4. Statut d’abonnement (essai) ===')
  const abo = await req('GET', '/abonnement', null, t2)
  assert(abo.status === 200, 'GET /api/abonnement → 200')
  assert(abo.data?.statut === 'essai', `statut = "essai"`, `(reçu: ${abo.data?.statut})`)
  assert(abo.data?.quotas?.factures === 10 && abo.data?.quotas?.clients === 5 && abo.data?.quotas?.produits === 3, 'Quotas 10 factures / 5 clients / 3 produits')
  assert(abo.data?.quotas?.notifications === 0, 'Notifications bloquées en essai (quota 0)')
  assert(abo.data?.jours_restants >= 6, `jours_restants ≈ 7`, `(reçu: ${abo.data?.jours_restants})`)

  console.log('\n=== 5. Quota clients (5 max en essai) ===')
  let quotaClientsRespecte = true
  for (let i = 1; i <= 6; i++) {
    const c = await req('POST', '/clients', { nom: `Client ${i}`, telephone: `699${String(i).padStart(3, '0')}000` }, t2)
    if (i <= 5 && c.status !== 201) quotaClientsRespecte = false
    if (i === 6 && !(c.status === 403 && c.data?.code === 'QUOTA_ATTEINT')) quotaClientsRespecte = false
    if (i === 6) console.log(`    → 6e client : HTTP ${c.status} ${c.data?.code || ''}`)
  }
  assert(quotaClientsRespecte, '5 clients acceptés, le 6e bloqué (403 QUOTA_ATTEINT)')

  console.log('\n=== 6. Quota produits (3 max en essai) ===')
  let quotaProduitsRespecte = true
  for (let i = 1; i <= 4; i++) {
    const p = await req('POST', '/produits', { nom: `Produit ${i}`, prix_vente: 1000 }, t2)
    if (i <= 3 && p.status !== 201) quotaProduitsRespecte = false
    if (i === 4 && !(p.status === 403 && p.data?.code === 'QUOTA_ATTEINT')) quotaProduitsRespecte = false
    if (i === 4) console.log(`    → 4e produit : HTTP ${p.status} ${p.data?.code || ''}`)
  }
  assert(quotaProduitsRespecte, '3 produits acceptés, le 4e bloqué (403 QUOTA_ATTEINT)')

  console.log('\n=== 7. Facture OK + notifications bloquées ===')
  const clients = await req('GET', '/clients', null, t2)
  const clientId = clients.data?.[0]?.id
  const fac = await req('POST', '/factures', {
    client_id: clientId, type: 'facture', items: [{ description: 'Service test', quantite: 2, prix_unitaire: 5000 }],
  }, t2)
  assert(fac.status === 201 && fac.data?.numero, 'POST /factures → 201 avec numéro auto', `(${fac.status})`)
  const notif = await req('POST', '/notifications/envoyer', { canal: 'whatsapp', destinataire: '699111222', message: 'Test' }, t2)
  assert(notif.status === 403 && notif.data?.code === 'QUOTA_ATTEINT', 'Envoi notification bloqué en essai (403)', `(${notif.status} ${notif.data?.code || ''})`)

  console.log('\n=== 8. Paramètres entreprise (modification OK en essai) ===')
  const params = await req('PUT', '/stats/entreprise', { devise: 'FCFA', prefixe_facture: 'FAC' }, t2)
  assert(params.status === 200, 'PUT /stats/entreprise → 200', `(${params.status})`)

  console.log('\n=== 9. Compteurs reflétés dans /abonnement ===')
  const abo2 = await req('GET', '/abonnement', null, t2)
  assert(abo2.data?.compteurs?.clients === 5, `compteurs.clients = 5`, `(reçu: ${abo2.data?.compteurs?.clients})`)
  assert(abo2.data?.compteurs?.produits === 3, `compteurs.produits = 3`, `(reçu: ${abo2.data?.compteurs?.produits})`)
  assert(abo2.data?.compteurs?.factures === 1, `compteurs.factures = 1`, `(reçu: ${abo2.data?.compteurs?.factures})`)

  console.log('\n=== 10. Super admin (vue plateforme + restauration) ===')
  const sa = await req('POST', '/auth/login', { email: 'superadmin@koleya.cm', mot_de_passe: 'admin123' })
  assert(sa.status === 200, 'Login superadmin → 200', `(${sa.status}) ${JSON.stringify(sa.data).slice(0, 120)}`)
  const saToken = sa.data?.accessToken
  if (saToken) {
    const list = await req('GET', '/admin/entreprises', null, saToken)
    assert(list.status === 200, 'GET /api/admin/entreprises → 200', `(${list.status})`)
    const maSarl = (list.data?.entreprises || []).find((e) => e.nom === 'Test SARL')
    assert(!!maSarl, 'Test SARL visible par le super admin')
    // Supprimer un client puis le restaurer
    const del = await req('DELETE', `/clients/${clientId}`, null, t2)
    assert(del.status === 200, 'DELETE client (soft delete) → 200', `(${del.status})`)
    const supprimes = await req('GET', `/admin/entreprises/${entId}/clients?supprimes=true`, null, saToken)
    const trouveSupprime = (supprimes.data?.clients || []).some((c) => c.id === clientId)
    assert(trouveSupprime, 'Client supprimé visible dans ?supprimes=true')
    const restore = await req('POST', `/admin/restaurer/clients/${clientId}`, null, saToken)
    assert(restore.status === 200, 'POST /admin/restaurer/clients/:id → 200', `(${restore.status}) ${JSON.stringify(restore.data).slice(0, 120)}`)
    // Un utilisateur normal ne doit PAS accéder à l'admin
    const denied = await req('GET', '/admin/entreprises', null, t2)
    assert(denied.status === 403, 'Utilisateur normal → 403 sur /admin', `(${denied.status})`)
  }

  console.log(`\n═══ RÉSULTAT : ${ok}/${total} tests réussis ═══\n`)
  process.exit(ok === total ? 0 : 1)
}

main().catch((e) => {
  console.error('Erreur d’exécution du script :', e.message)
  process.exit(1)
})
