-- Migration: Create fournisseurs table
-- Date: 2026-08-23T08:10:41.940Z

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
