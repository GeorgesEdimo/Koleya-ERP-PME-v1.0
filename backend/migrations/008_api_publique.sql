-- =============================================
-- API publique : cles API, webhooks, rate limiting
-- =============================================

-- CLES API
CREATE TABLE IF NOT EXISTS api_cles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    cle_publique VARCHAR(50) NOT NULL,
    cle_privee VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '["read"]', -- read, write, admin
    rate_limit INTEGER DEFAULT 1000, -- requetes par heure
    actif BOOLEAN DEFAULT true,
    derniere_utilisation TIMESTAMP,
    expires_at TIMESTAMP,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_api_cles_publique ON api_cles(cle_publique);
CREATE INDEX idx_api_cles_entreprise ON api_cles(entreprise_id);

-- LOGS D'UTILISATION API
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_cle_id UUID NOT NULL REFERENCES api_cles(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    methode VARCHAR(10) NOT NULL,
    status_code INTEGER,
    duree_ms INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_api_logs_cle ON api_logs(api_cle_id);
CREATE INDEX idx_api_logs_date ON api_logs(cree_le DESC);

-- WEBHOOKS
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    events JSONB DEFAULT '["facture.creee"]', -- facture.creee, facture.payee, credit.retard, stock.rupture
    secret VARCHAR(255),
    actif BOOLEAN DEFAULT true,
    derniere_invocation TIMESTAMP,
    derniere_reponse INTEGER,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_webhooks_entreprise ON webhooks(entreprise_id);

-- LOGS WEBHOOKS
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL,
    payload JSONB,
    status_code INTEGER,
    reponse TEXT,
    duree_ms INTEGER,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_webhook_logs_webhook ON webhook_logs(webhook_id);
