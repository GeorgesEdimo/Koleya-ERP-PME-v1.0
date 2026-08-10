-- =============================================
-- Stock avance : multi-depots, codes-barres, mouvements
-- =============================================

-- DEPOTS
CREATE TABLE IF NOT EXISTS depots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    responsable VARCHAR(255),
    principal BOOLEAN DEFAULT false,
    actif BOOLEAN DEFAULT true,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_depots_entreprise ON depots(entreprise_id);

-- STOCK PAR DEPOT
CREATE TABLE IF NOT EXISTS stock_depot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produit_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    depot_id UUID NOT NULL REFERENCES depots(id) ON DELETE CASCADE,
    quantite INTEGER DEFAULT 0,
    UNIQUE(produit_id, depot_id)
);
CREATE INDEX idx_stock_depot_produit ON stock_depot(produit_id);
CREATE INDEX idx_stock_depot_depot ON stock_depot(depot_id);

-- MOUVEMENTS DE STOCK
CREATE TABLE IF NOT EXISTS mouvements_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    depot_id UUID REFERENCES depots(id),
    depot_destination_id UUID REFERENCES depots(id),
    type_mouvement VARCHAR(30) NOT NULL, -- entree, sortie, transfert, ajustement, inventaire
    quantite INTEGER NOT NULL,
    quantite_avant INTEGER,
    quantite_apres INTEGER,
    prix_unitaire DECIMAL(15,2),
    motif TEXT,
    reference VARCHAR(100), -- bon de commande, facture, etc.
    utilisateur VARCHAR(255),
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_mouvements_entreprise ON mouvements_stock(entreprise_id);
CREATE INDEX idx_mouvements_produit ON mouvements_stock(produit_id);
CREATE INDEX idx_mouvements_date ON mouvements_stock(cree_le DESC);
CREATE INDEX idx_mouvements_type ON mouvements_stock(type_mouvement);

-- Ajouter codes-barres aux produits existants
ALTER TABLE produits ADD COLUMN IF NOT EXISTS code_barres VARCHAR(100);
ALTER TABLE produits ADD COLUMN IF NOT EXISTS unite VARCHAR(20) DEFAULT 'unite';
ALTER TABLE produits ADD COLUMN IF NOT EXISTS emplacement VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_produits_code_barres ON produits(code_barres);

-- Vue stock par depot
CREATE OR REPLACE VIEW v_stock_depot AS
SELECT
    p.id AS produit_id, p.nom AS produit_nom, p.reference, p.code_barres,
    d.id AS depot_id, d.nom AS depot_nom,
    COALESCE(sd.quantite, 0) AS quantite,
    p.prix_achat, p.prix_vente,
    COALESCE(sd.quantite, 0) * p.prix_achat AS valeur
FROM produits p
CROSS JOIN depots d
LEFT JOIN stock_depot sd ON sd.produit_id = p.id AND sd.depot_id = d.id
WHERE p.actif IS NOT FALSE;
