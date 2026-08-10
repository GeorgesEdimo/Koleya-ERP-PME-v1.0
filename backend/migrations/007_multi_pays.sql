-- =============================================
-- Expansion geographique : support multi-pays
-- =============================================

-- Table des pays supportes
CREATE TABLE IF NOT EXISTS pays (
    code VARCHAR(5) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    devise VARCHAR(10) NOT NULL,
    symbole_devise VARCHAR(5),
    fuseau VARCHAR(50) NOT NULL,
    langue_principale VARCHAR(10) DEFAULT 'fr',
    format_telephone VARCHAR(50),
    prefixe_telephone VARCHAR(10),
    provider_sms VARCHAR(50),
    provider_mobile_money VARCHAR(50),
    actif BOOLEAN DEFAULT true
);

-- Inserts des pays supportes
INSERT INTO pays (code, nom, devise, symbole_devise, fuseau, prefixe_telephone, provider_sms) VALUES
('CM', 'Cameroun', 'XAF', 'FCFA', 'Africa/Douala', '+237', 'africastalking'),
('GA', 'Gabon', 'XAF', 'FCFA', 'Africa/Libreville', '+241', 'africastalking'),
('CG', 'Congo', 'XAF', 'FCFA', 'Africa/Brazzaville', '+242', 'africastalking'),
('CI', 'Cote d''Ivoire', 'XOF', 'FCFA', 'Africa/Abidjan', '+225', 'africastalking'),
('SN', 'Senegal', 'XOF', 'FCFA', 'Africa/Dakar', '+221', 'africastalking'),
('NG', 'Nigeria', 'NGN', '₦', 'Africa/Lagos', '+234', 'africastalking')
ON CONFLICT (code) DO NOTHING;

-- Ajouter le pays a l'entreprise
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS pays_code VARCHAR(5) DEFAULT 'CM';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS langue VARCHAR(10) DEFAULT 'fr';

-- Table de localisation (pour les adresses)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ville VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pays_code VARCHAR(5) DEFAULT 'CM';

-- Configuration par pays
CREATE TABLE IF NOT EXISTS config_pays (
    pays_code VARCHAR(5) NOT NULL REFERENCES pays(code),
    cle VARCHAR(100) NOT NULL,
    valeur TEXT,
    PRIMARY KEY (pays_code, cle)
);

-- Configurations specifiques par pays
INSERT INTO config_pays (pays_code, cle, valeur) VALUES
('CM', 'tva_defaut', '19.25'),
('CM', 'cnps_taux_salarie', '0.042'),
('CM', 'cnps_taux_employeur', '0.0865'),
('CM', 'irpp_tranches', '[[0,200000,0],[200001,300000,10],[300001,+∞,15]]'),
('GA', 'tva_defaut', '18'),
('CG', 'tva_defaut', '18.9'),
('CI', 'tva_defaut', '18'),
('SN', 'tva_defaut', '18');
