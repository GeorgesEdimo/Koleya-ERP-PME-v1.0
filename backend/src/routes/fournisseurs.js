// backend/src/routes/fournisseurs.js
const express = require('express');
const { auth, validation } = require('../middleware');
const db = require('../config/database');

const router = express.Router();

/**
 * GET /api/fournisseurs - Liste tous les fournisseurs
 */
router.get('/', auth, async (req, res) => {
  try {
    const { actif, type, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM fournisseurs WHERE 1=1';
    const params = [];

    if (actif !== undefined) {
      query += ' AND actif = $' + (params.length + 1);
      params.push(actif === 'true');
    }

    if (type) {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }

    if (search) {
      query += ' AND (nom ILIKE $' + (params.length + 1) + ' OR code ILIKE $' + (params.length + 1) + ')';
      params.push('%' + search + '%');
    }

    const totalResult = await db.query('SELECT COUNT(*) FROM fournisseurs WHERE 1=1' + query.slice(36), params);
    const total = parseInt(totalResult.rows[0].count);

    query += ' ORDER BY nom ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      fournisseurs: result.rows,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching fournisseurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

/**
 * GET /api/fournisseurs/:id - Détail fournisseur
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM fournisseurs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/fournisseurs - Créer fournisseur
 */
router.post('/', auth, async (req, res) => {
  try {
    const { nom, email, telephone, adresse, ville, pays = 'Cameroun', type, categorie, conditions_paiement, delai_livraison_jours } = req.body;

    if (!nom) {
      return res.status(400).json({ error: 'Nom requis' });
    }

    // Générer code automatiquement
    const codeResult = await db.query('SELECT COUNT(*) FROM fournisseurs');
    const code = 'FOUR-' + String(parseInt(codeResult.rows[0].count) + 1).padStart(4, '0');

    const result = await db.query(
      'INSERT INTO fournisseurs (code, nom, email, telephone, adresse, ville, pays, type, categorie, conditions_paiement, delai_livraison_jours, actif) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true) RETURNING *',
      [code, nom, email, telephone, adresse, ville, pays, type, categorie, conditions_paiement, delai_livraison_jours]
    );

    res.status(201).json({ fournisseur: result.rows[0], message: 'Fournisseur créé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

/**
 * PUT /api/fournisseurs/:id - Modifier fournisseur
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, telephone, adresse, ville, type, categorie, conditions_paiement, delai_livraison_jours, actif } = req.body;

    const result = await db.query(
      'UPDATE fournisseurs SET nom = COALESCE($1, nom), email = COALESCE($2, email), telephone = COALESCE($3, telephone), adresse = COALESCE($4, adresse), ville = COALESCE($5, ville), type = COALESCE($6, type), categorie = COALESCE($7, categorie), conditions_paiement = COALESCE($8, conditions_paiement), delai_livraison_jours = COALESCE($9, delai_livraison_jours), actif = COALESCE($10, actif), updated_at = NOW() WHERE id = $11 RETURNING *',
      [nom, email, telephone, adresse, ville, type, categorie, conditions_paiement, delai_livraison_jours, actif, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    res.json({ fournisseur: result.rows[0], message: 'Fournisseur modifié' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

/**
 * DELETE /api/fournisseurs/:id - Supprimer (soft delete)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE fournisseurs SET actif = false, updated_at = NOW() WHERE id = $1', [id]);
    res.json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
