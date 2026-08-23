import React, { useState, useEffect } from 'react';
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

  const fetchFournisseurs = React.useCallback(async () => {
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
  }, [page, search]);

  useEffect(() => {
    fetchFournisseurs();
  }, [fetchFournisseurs]);

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
      await api.put(`/fournisseurs/${id}`, data);
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
        await api.delete(`/fournisseurs/${id}`);
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
