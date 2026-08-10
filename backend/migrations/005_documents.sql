-- 005_documents.sql — documents administratifs téléversés (contrats, pièces, scans…)
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id uuid NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  nom text NOT NULL,
  type_mime text,
  taille integer DEFAULT 0,
  contenu text,
  cree_le timestamptz DEFAULT now(),
  supprime_le timestamptz
);
CREATE INDEX IF NOT EXISTS idx_documents_entreprise ON documents(entreprise_id);
