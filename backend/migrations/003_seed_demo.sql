-- =============================================
-- Koleya — Seed du compte de démonstration
-- Compte : admin@koleya.com / admin123
-- Exécuter après 001_init.sql et 002_notifications.sql
-- =============================================

DO $$
DECLARE
  v_entreprise_id UUID;
BEGIN
  IF EXISTS (SELECT FROM utilisateurs WHERE email = 'admin@koleya.com') THEN
    RAISE NOTICE 'Compte demo deja present.';
    RETURN;
  END IF;

  -- Entreprise de démonstration
  INSERT INTO entreprises (nom, adresse, telephone, email, nrcc, plan)
  VALUES (
    'Koleya Démo',
    'Douala, Cameroun',
    '+237 6XX XXX XXX',
    'contact@koleya.cm',
    'RC/DLA/2026/0000',
    'pro'
  )
  RETURNING id INTO v_entreprise_id;

  -- Utilisateur propriétaire (mot de passe : admin123, hash bcrypt)
  INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role)
  VALUES (
    v_entreprise_id,
    'admin@koleya.com',
    '$2a$12$z7EdyoOqeMYuUt4HNhTsaeCkN5rYHbOC9lfNgiVxpnRgUraaOSGji',
    'Admin Koleya',
    '+237 600 000 000',
    'proprietaire'
  );

  RAISE NOTICE 'Compte demo cree : admin@koleya.com / admin123';
END
$$;
