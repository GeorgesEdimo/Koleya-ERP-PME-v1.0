import query from '../lib/db.js'
import { handler } from '../lib/auth.js'

export default handler(async (req, res) => {
  const { method } = req

  if (method === 'GET') {
    const result = await query(
      'SELECT * FROM clients WHERE entreprise_id = $1 ORDER BY cree_le DESC',
      [req.entrepriseId])
    return res.json(result.rows)
  }

  if (method === 'POST') {
    const { nom, telephone, email, adresse } = req.body
    if (!nom) return res.status(400).json({ error: 'Le nom du client est requis' })
    const result = await query(
      `INSERT INTO clients (entreprise_id, nom, telephone, email, adresse)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.entrepriseId, nom, telephone, email, adresse])
    return res.status(201).json(result.rows[0])
  }

  if (method === 'PUT') {
    const { id, nom, telephone, email, adresse } = req.body
    const result = await query(
      `UPDATE clients SET nom=COALESCE($1,nom), telephone=COALESCE($2,telephone),
       email=COALESCE($3,email), adresse=COALESCE($4,adresse), mis_a_jour_le=NOW()
       WHERE id=$5 AND entreprise_id=$6 RETURNING *`,
      [nom, telephone, email, adresse, id, req.entrepriseId])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client non trouve' })
    return res.json(result.rows[0])
  }

  if (method === 'DELETE') {
    const result = await query(
      'DELETE FROM clients WHERE id=$1 AND entreprise_id=$2 RETURNING id',
      [req.query?.id || req.body?.id, req.entrepriseId])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client non trouve' })
    return res.json({ message: 'Client supprime' })
  }

  res.status(405).json({ error: 'Method not allowed' })
})
