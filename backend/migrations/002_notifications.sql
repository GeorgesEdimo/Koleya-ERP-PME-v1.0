-- =============================================
-- Notifications SMS/WhatsApp
-- =============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    canal VARCHAR(20) NOT NULL DEFAULT 'sms', -- sms, whatsapp, email
    destinataire VARCHAR(255) NOT NULL, -- telephone ou email
    destinataire_nom VARCHAR(255),
    sujet VARCHAR(255),
    message TEXT NOT NULL,
    statut VARCHAR(20) DEFAULT 'en_attente', -- en_attente, envoye, echec, annule
    type_source VARCHAR(50), -- facture_relance, credit_rappel, stock_alerte, manuel
    source_id UUID, -- ID de la facture, credit, produit concerne
    date_envoi TIMESTAMP,
    reponse_api TEXT, -- reponse brute du provider SMS
    erreur TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_entreprise ON notifications(entreprise_id);
CREATE INDEX idx_notifications_statut ON notifications(statut);
CREATE INDEX idx_notifications_type ON notifications(type_source);
CREATE INDEX idx_notifications_date ON notifications(cree_le DESC);

-- =============================================
-- Regles de notification automatique
-- =============================================
CREATE TABLE notification_regles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    type_source VARCHAR(50) NOT NULL, -- facture_retard, credit_retard, stock_rupture
    actif BOOLEAN DEFAULT true,
    delai_jours INTEGER DEFAULT 3, -- jours avant relance
    template_sms TEXT,
    template_whatsapp TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_regles_entreprise ON notification_regles(entreprise_id);

-- Regles par defaut pour les entreprises
-- (seront inserees lors de la creation d'une entreprise)
