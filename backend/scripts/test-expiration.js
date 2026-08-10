// =============================================
// Koleya — Test expiration jour 7 + paiement mock
// Usage : node scripts/test-expiration.js
// Simule l'expiration (UPDATE essai_fin via psql), vérifie la lecture seule,
// puis POST /api/abonnement/payer et vérifie le retour à la normale.
// =============================================
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execSync } = require('child_process')

const BASE = process.env.API_BASE || 'http://localhost:3001/api'
let total = 0
let ok = 0

function assert(cond, label, detail = '') {
  total++
  if (cond) { ok++; console.log(`  ✅ ${label}`) }
  else { console.log(`  ❌ ${label} ${detail}`) }
}

async function req(method, p, body, token) {
  const res = await fetch(`${BASE}${p}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json().catch(() => ({})) }
}

function expireEntreprise(id) {
  const sqlFile = path.join(os.tmpdir(), `koleya_expire_${Date.now()}.sql`)
  fs.writeFileSync(sqlFile, `UPDATE entreprises SET essai_fin = NOW() - INTERVAL '1 day' WHERE id = '${id}';\n`)
  const psql = process.env.PSQL_PATH || 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe'
  execSync(`"${psql}" -U koleya -h localhost -d koleya -f "${sqlFile}"`, { env: { ...process.env, PGPASSWORD: 'koleya' } })
  fs.unlinkSync(sqlFile)
}

async function main() {
  console.log('\n=== 1. Inscription (nouvelle entreprise de test) ===')
  const email = `expire${Date.now()}@koleya.cm`
  const signup = await req('POST', '/auth/signup', {
    email, mot_de_passe: 'password123', nom: 'Expire Test', entreprise_nom: 'Expire SARL',
  })
  assert(signup.status === 201, 'Signup → 201', `(${signup.status})`)
  const entId = signup.data.user.entreprise_id
  const token = signup.data.accessToken

  // Preuve que l'écriture fonctionne avant expiration
  const client = await req('POST', '/clients', { nom: 'Client Avant' }, token)
  assert(client.status === 201, 'Création client OK en essai (avant expiration)', `(${client.status})`)
  const clientId = client.data.id

  console.log('\n=== 2. Simulation expiration (essai_fin dans le passé) ===')
  expireEntreprise(entId)
  console.log('  → essai_fin mis à hier via psql')

  console.log('\n=== 3. État expiré ===')
  const abo = await req('GET', '/abonnement', null, token)
  assert(abo.data?.statut === 'expire', `statut = "expire"`, `(reçu: ${abo.data?.statut})`)
  assert(abo.data?.export_permis === false, 'export_permis = false (export PDF bloqué)')

  const lecture = await req('GET', '/clients', null, token)
  assert(lecture.status === 200, 'Lecture OK (GET /clients → 200)', `(${lecture.status})`)

  const writeClient = await req('POST', '/clients', { nom: 'Client Après' }, token)
  assert(writeClient.status === 403 && writeClient.data?.code === 'ABONNEMENT_EXPIRE',
    'Écriture client bloquée (403 ABONNEMENT_EXPIRE)', `(${writeClient.status} ${writeClient.data?.code || ''})`)

  const writeFacture = await req('POST', '/factures', { client_id: clientId, items: [{ description: 'x', quantite: 1, prix_unitaire: 100 }] }, token)
  assert(writeFacture.status === 403, 'Création facture bloquée', `(${writeFacture.status})`)

  const writeParams = await req('PUT', '/stats/entreprise', { devise: 'FCFA' }, token)
  assert(writeParams.status === 403, 'Modification entreprise bloquée', `(${writeParams.status})`)

  console.log('\n=== 4. Paiement mock (POST /api/abonnement/payer) ===')
  const payer = await req('POST', '/abonnement/payer', { plan: 'pro' }, token)
  assert(payer.status === 200, 'Payer → 200', `(${payer.status}) ${JSON.stringify(payer.data).slice(0, 120)}`)

  const abo2 = await req('GET', '/abonnement', null, token)
  assert(abo2.data?.statut === 'actif', `statut = "actif" après paiement`, `(reçu: ${abo2.data?.statut})`)
  assert(abo2.data?.plan === 'pro', `plan = "pro"`, `(reçu: ${abo2.data?.plan})`)
  assert(abo2.data?.export_permis === true, 'export_permis = true après paiement')
  assert(abo2.data?.compteurs?.clients === 0, 'compteurs remis à zéro (achat = reset)', `(reçu: ${abo2.data?.compteurs?.clients})`)

  const writeAfter = await req('POST', '/clients', { nom: 'Client Payant' }, token)
  assert(writeAfter.status === 201, 'Écriture de nouveau autorisée après paiement', `(${writeAfter.status})`)

  // Le quota ne s'applique plus (plan payant) : on peut dépasser 5 clients
  let canGoBeyond = true
  for (let i = 0; i < 6; i++) {
    const c = await req('POST', '/clients', { nom: `Client Payant ${i}` }, token)
    if (c.status !== 201) { canGoBeyond = false; break }
  }
  assert(canGoBeyond, 'Plus aucun quota en plan payant (créations illimitées)')

  console.log(`\n═══ RÉSULTAT : ${ok}/${total} tests réussis ═══\n`)
  process.exit(ok === total ? 0 : 1)
}

main().catch((e) => {
  console.error('Erreur d’exécution :', e.message)
  process.exit(1)
})
