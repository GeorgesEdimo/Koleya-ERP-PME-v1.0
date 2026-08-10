const express = require('express')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { attacherAbonnement, verifierEcriture } = require('../middleware/abonnement')

const router = express.Router()
router.use(authenticate, attacherAbonnement)

// Limite : 10 Mo par fichier
const TAILLE_MAX = 10 * 1024 * 1024

// GET /api/documents — liste (hors supprimés)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, nom, type_mime, taille, cree_le
       FROM documents WHERE entreprise_id = $1 AND supprime_le IS NULL
       ORDER BY cree_le DESC`,
      [req.entrepriseId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Erreur GET documents:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/documents — téléverser un fichier (contenu base64)
router.post('/', verifierEcriture, async (req, res) => {
  try {
    const { nom, type_mime, taille, contenu } = req.body || {}
    if (!nom || !contenu) return res.status(400).json({ error: 'Fichier requis (nom + contenu)' })
    if (taille > TAILLE_MAX) return res.status(413).json({ error: 'Fichier trop volumineux (max 10 Mo)' })
    const result = await query(
      `INSERT INTO documents (entreprise_id, nom, type_mime, taille, contenu)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nom, type_mime, taille, cree_le`,
      [req.entrepriseId, nom, type_mime || 'application/octet-stream', taille || 0, contenu]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erreur POST document:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/documents/:id/contenu — télécharger
router.get('/:id/contenu', async (req, res) => {
  try {
    const result = await query(
      'SELECT nom, type_mime, contenu FROM documents WHERE id = $1 AND entreprise_id = $2 AND supprime_le IS NULL',
      [req.params.id, req.entrepriseId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document introuvable' })
    const doc = result.rows[0]
    const buf = Buffer.from(doc.contenu, 'base64')
    res.setHeader('Content-Type', doc.type_mime || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.nom)}"`)
    res.send(buf)
  } catch (err) {
    console.error('Erreur GET contenu document:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/documents/:id — suppression logique
router.delete('/:id', verifierEcriture, async (req, res) => {
  try {
    await query('UPDATE documents SET supprime_le = now() WHERE id = $1 AND entreprise_id = $2', [req.params.id, req.entrepriseId])
    res.json({ ok: true })
  } catch (err) {
    console.error('Erreur DELETE document:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
