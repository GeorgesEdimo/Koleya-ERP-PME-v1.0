-- =============================================
-- Auth avancee : 2FA, Gmail OAuth, reset MDP
-- =============================================

-- Codes 2FA
CREATE TABLE IF NOT EXISTS two_factor_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    canal VARCHAR(20) NOT NULL DEFAULT 'sms', -- sms, email
    utilise BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_2fa_user ON two_factor_codes(utilisateur_id);

-- Activer/desactiver le 2FA par utilisateur
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS two_factor_active BOOLEAN DEFAULT false;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS two_factor_canal VARCHAR(20) DEFAULT 'sms';

-- Tokens de reinitialisation MDP
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    utilise BOOLEAN DEFAULT false,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_password_resets_user ON password_resets(utilisateur_id);

-- Comptes Google OAuth
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_utilisateurs_google ON utilisateurs(google_id) WHERE google_id IS NOT NULL;

-- Historique des connexions
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    succes BOOLEAN DEFAULT true,
    methode VARCHAR(20) DEFAULT 'password', -- password, sms, google
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_login_history_user ON login_history(utilisateur_id);
