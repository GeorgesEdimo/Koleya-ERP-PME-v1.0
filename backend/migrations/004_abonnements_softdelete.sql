-- =============================================
-- Koleya — Abonnements (essai 7j), quotas, soft delete et super admin
-- Exécuter après 001, 002 et 003.
-- =============================================

-- -------------------------------------------------------------
-- 1. Essai / abonnement sur la table entreprises
-- -------------------------------------------------------------
ALTER TABLE entreprises
  ADD COLUMN IF NOT EXISTS essai_fin TIMESTAMP,
  ADD COLUMN IF NOT EXISTS essai_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS periode_comptage_debut TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS dernier_achat_le TIMESTAMP;

-- -------------------------------------------------------------
-- 2. Soft delete sur les entités principales
-- -------------------------------------------------------------
ALTER TABLE clients      ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE clients      ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE factures     ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE factures     ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE credits      ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE credits      ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE produits     ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE produits     ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE employes     ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE employes     ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE depenses     ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE depenses     ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS supprime_par UUID;

-- -------------------------------------------------------------
-- 3. Super admin (rôle plateforme)
-- -------------------------------------------------------------
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS est_super_admin BOOLEAN DEFAULT false;

-- Compte super admin de la plateforme (mot de passe : admin123)
DO $$
DECLARE
  v_eid UUID;
  v_hash TEXT := '$2a$12$z7EdyoOqeMYuUt4HNhTsaeCkN5rYHbOC9lfNgiVxpnRgUraaOSGji';
BEGIN
  IF EXISTS (SELECT FROM utilisateurs WHERE email = 'superadmin@koleya.cm') THEN
    RAISE NOTICE 'Super admin deja present.';
    RETURN;
  END IF;

  -- Entreprise dédiée à la plateforme (créée si base vide)
  SELECT id INTO v_eid FROM entreprises WHERE nom = 'Koleya Plateforme';
  IF v_eid IS NULL THEN
    INSERT INTO entreprises (nom, plan, actif) VALUES ('Koleya Plateforme', 'business', true)
    RETURNING id INTO v_eid;
  END IF;

  INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role, est_super_admin, actif)
  VALUES (v_eid, 'superadmin@koleya.cm', v_hash, 'Super Admin Koleya', '+237 600 000 001', 'admin', true, true);

  RAISE NOTICE 'Super admin cree : superadmin@koleya.cm / admin123';
END
$$;