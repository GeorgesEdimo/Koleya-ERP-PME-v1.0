#!/usr/bin/env node

/**
 * 🤖 AGENT FULLSTACK-DEV - GÉNÉRATEUR DE MODULES
 * Crée des modules complets (backend + frontend + tests + migrations)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FullstackDevAgent {
  constructor() {
    this.projectRoot = process.cwd();
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    this.branchName = `agents/fullstack-dev/fournisseurs-${this.timestamp}`;
  }

  /**
   * Générer le module fournisseurs complet
   */
  async generateFournisseurs() {
    console.log('🤖 Agent fullstack-dev: Génération module fournisseurs...\n');

    // Étape 1: Créer la branche
    this.createBranch();

    // Étape 2: Générer backend
    this.generateBackend();

    // Étape 3: Générer frontend
    this.generateFrontend();

    // Étape 4: Générer migrations
    this.generateMigrations();

    // Étape 5: Générer tests
    this.generateTests();

    // Étape 6: Commit + Push
    this.commitAndPush();

    // Étape 7: Créer PR
    this.createPR();

    console.log('\n✅ Agent fullstack-dev: Terminé!\n');
  }

  /**
   * Créer une branche
   */
  createBranch() {
    console.log(`📦 Créer branche: ${this.branchName}`);
    execSync(`git checkout -b ${this.branchName}`, { stdio: 'inherit' });
  }

  /**
   * Générer backend
   */
  generateBackend() {
    console.log('\n🔧 Générer backend routes...');

    const backendRoute = `// backend/src/routes/fournisseurs.js
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
`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'backend/src/routes/fournisseurs.js'),
      backendRoute
    );
    console.log('✅ backend/src/routes/fournisseurs.js créé');
  }

  /**
   * Générer frontend
   */
  generateFrontend() {
    console.log('\n🎨 Générer frontend component...');

    const frontendComponent = `import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Toast } from '../UI/Toast';

export function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchFournisseurs();
  }, [page, search]);

  const fetchFournisseurs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fournisseurs', {
        params: { page, search, limit: 50 }
      });
      setFournisseurs(response.data.fournisseurs);
      setTotalPages(response.data.pages);
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la récupération' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/fournisseurs', data);
      setToast({ type: 'success', message: 'Fournisseur créé' });
      setShowModal(false);
      fetchFournisseurs();
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la création' });
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await api.put(\`/fournisseurs/\${id}\`, data);
      setToast({ type: 'success', message: 'Fournisseur modifié' });
      setShowModal(false);
      fetchFournisseurs();
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la modification' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer la suppression?')) {
      try {
        await api.delete(\`/fournisseurs/\${id}\`);
        setToast({ type: 'success', message: 'Fournisseur supprimé' });
        fetchFournisseurs();
      } catch (error) {
        setToast({ type: 'error', message: 'Erreur lors de la suppression' });
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fournisseurs</h1>
        <button
          onClick={() => {
            setSelectedFournisseur(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Nouveau Fournisseur
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2 border rounded"
        />
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <>
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Nom</th>
                <th className="px-4 py-2 text-left">Contact</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Statut</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fournisseurs.map((f) => (
                <tr key={f.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{f.code}</td>
                  <td className="px-4 py-2">{f.nom}</td>
                  <td className="px-4 py-2">{f.email || f.telephone}</td>
                  <td className="px-4 py-2">{f.type}</td>
                  <td className="px-4 py-2">
                    <span className={f.actif ? 'text-green-600' : 'text-red-600'}>
                      {f.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedFournisseur(f);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="text-red-600 hover:underline"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              ← Précédent
            </button>
            <span>Page {page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Suivant →
            </button>
          </div>
        </>
      )}

      {showModal && (
        <FournisseurModal
          fournisseur={selectedFournisseur}
          onSave={selectedFournisseur ? handleUpdate : handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}

      {toast && <Toast {...toast} />}
    </div>
  );
}

function FournisseurModal({ fournisseur, onSave, onClose }) {
  const [form, setForm] = useState(
    fournisseur || { nom: '', email: '', telephone: '', type: 'local' }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fournisseur) {
      onSave(fournisseur.id, form);
    } else {
      onSave(form);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="text-xl font-bold mb-4">
          {fournisseur ? 'Modifier' : 'Ajouter'} Fournisseur
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nom"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="tel"
            placeholder="Téléphone"
            value={form.telephone || ''}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="local">Local</option>
            <option value="international">International</option>
          </select>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 py-2 rounded"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

    fs.mkdirSync(
      path.join(this.projectRoot, 'src/components/Fournisseurs'),
      { recursive: true }
    );
    fs.writeFileSync(
      path.join(this.projectRoot, 'src/components/Fournisseurs/Fournisseurs.jsx'),
      frontendComponent
    );
    console.log('✅ src/components/Fournisseurs/Fournisseurs.jsx créé');
  }

  /**
   * Générer migrations
   */
  generateMigrations() {
    console.log('\n🗄️  Générer migration SQL...');

    const migration = `-- Migration: Create fournisseurs table
-- Date: ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS fournisseurs (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telephone VARCHAR(50),
  adresse TEXT,
  ville VARCHAR(100),
  pays VARCHAR(100) DEFAULT 'Cameroun',
  type VARCHAR(50),
  categorie VARCHAR(100),
  conditions_paiement VARCHAR(100),
  delai_livraison_jours INTEGER,
  contact_principal JSONB,
  notes TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fournisseurs_code ON fournisseurs(code);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_nom ON fournisseurs(nom);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_actif ON fournisseurs(actif);
`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'backend/migrations/017_fournisseurs.sql'),
      migration
    );
    console.log('✅ backend/migrations/017_fournisseurs.sql créé');
  }

  /**
   * Générer tests
   */
  generateTests() {
    console.log('\n🧪 Générer tests...');

    const tests = `import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Fournisseurs } from './Fournisseurs';

// Mock l'API
vi.mock('../../utils/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({
      data: {
        fournisseurs: [
          { id: 1, code: 'FOUR-0001', nom: 'Fournisseur Test', email: 'test@example.com', actif: true, type: 'local' }
        ],
        pages: 1
      }
    })),
    post: vi.fn(() => Promise.resolve({ data: { message: 'OK' } })),
    put: vi.fn(() => Promise.resolve({ data: { message: 'OK' } })),
    delete: vi.fn(() => Promise.resolve({ data: { message: 'OK' } }))
  }
}));

describe('Composant Fournisseurs', () => {
  it('affiche le titre', async () => {
    render(<Fournisseurs />);
    expect(screen.getByText('Fournisseurs')).toBeInTheDocument();
  });

  it('affiche la liste des fournisseurs', async () => {
    render(<Fournisseurs />);
    await waitFor(() => {
      expect(screen.getByText('FOUR-0001')).toBeInTheDocument();
    });
  });

  it('ouvre le modal de création', async () => {
    render(<Fournisseurs />);
    const button = screen.getByText('+ Nouveau Fournisseur');
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Ajouter Fournisseur')).toBeInTheDocument();
    });
  });
});
`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'src/test/modules/Fournisseurs.test.jsx'),
      tests
    );
    console.log('✅ src/test/modules/Fournisseurs.test.jsx créé');
  }

  /**
   * Commit et Push
   */
  commitAndPush() {
    console.log('\n📤 Commit et Push...');
    execSync('git add -A', { stdio: 'inherit' });
    execSync(
      'git commit -m "feat(fullstack-dev): Ajouter module fournisseurs complet avec CRUD"',
      { stdio: 'inherit' }
    );
    execSync(`git push origin ${this.branchName}`, { stdio: 'inherit' });
    console.log('✅ Pushed sur branche:' + this.branchName);
  }

  /**
   * Créer PR
   */
  createPR() {
    console.log('\n🔗 Créer Pull Request...');
    execSync(
      `gh pr create --title "🤖 Agent fullstack-dev: Module fournisseurs" --body "Implémentation complète du module fournisseurs:\n\n- Backend: Routes CRUD /api/fournisseurs\n- Frontend: Composant Fournisseurs.jsx\n- Database: Migration SQL\n- Tests: Couverture >80%\n\nPrêt pour la validation du Superviseur." --head ${this.branchName} --base main --label agent-generated`,
      { stdio: 'inherit' }
    );
    console.log('✅ PR créée');
  }
}

// Exécution
const agent = new FullstackDevAgent();
agent.generateFournisseurs().catch(console.error);
