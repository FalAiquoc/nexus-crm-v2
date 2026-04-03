-- ============================================
-- SQL DE SETUP - NEXUS CRM v2
-- ============================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS pgsodium;

-- TABELAS PRINCIPAIS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    segment VARCHAR(100),
    size VARCHAR(50),
    address JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    source VARCHAR(100),
    score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Novo Lead',
    company_id TEXT REFERENCES companies(id),
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pipelines (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stages (
    id TEXT PRIMARY KEY,
    pipeline_id TEXT REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    required_fields JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    value DECIMAL(12, 2) DEFAULT 0,
    lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
    stage_id TEXT REFERENCES stages(id) ON DELETE SET NULL,
    owner_id TEXT REFERENCES users(id),
    probability INTEGER DEFAULT 0,
    expected_close_date DATE,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'Agendado',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    billing_interval VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'active',
    next_billing_date DATE,
    last_billing_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_hours (
    day_of_week INTEGER PRIMARY KEY,
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_stages_pipeline ON stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);

-- SEEDS BÁSICOS
INSERT INTO pipelines (id, name, is_default) VALUES ('p1', 'Vendas B2B', TRUE) ON CONFLICT DO NOTHING;

INSERT INTO stages (id, pipeline_id, name, sort_order) VALUES
('s1', 'p1', 'Novo Lead', 1),
('s2', 'p1', 'Em Contato', 2),
('s3', 'p1', 'Qualificado', 3),
('s4', 'p1', 'Proposta', 4),
('s5', 'p1', 'Negociação', 5),
('s6', 'p1', 'Fechado', 6)
ON CONFLICT DO NOTHING;

INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(0, NULL, NULL, TRUE),
(1, '08:00', '18:00', FALSE),
(2, '08:00', '18:00', FALSE),
(3, '08:00', '18:00', FALSE),
(4, '08:00', '18:00', FALSE),
(5, '08:00', '18:00', FALSE),
(6, '08:00', '14:00', FALSE)
ON CONFLICT DO NOTHING;
