-- ===================================================================
-- WEBHOOK SECURITY RULES - Migração de Segurança para Webhooks
-- Objetivo: Validar origem, IPs, instâncias e prevenir ataques
-- Data: 2026-04-14
-- ===================================================================

-- TABELA: Regras de Segurança de Webhooks
CREATE TABLE IF NOT EXISTS webhook_security_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('ip_whitelist', 'instance_validation', 'signature_validation', 'rate_limit')),
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Maior número = maior prioridade
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- TABELA: Log de Auditoria de Webhooks (TODOS os eventos)
CREATE TABLE IF NOT EXISTS webhook_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'MESSAGES_UPSERT', 'CONNECTION_UPDATE', etc.
    source_ip INET, -- Endereço IP de origem
    phone_number VARCHAR(20), -- Número envolvido
    payload_size INTEGER, -- Tamanho do payload em bytes
    validation_status VARCHAR(50) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected', 'blocked')),
    rejection_reason TEXT, -- Motivo da rejeição (se aplicável)
    processing_time_ms INTEGER, -- Tempo de processamento em ms
    payload_hash VARCHAR(64), -- Hash SHA-256 do payload para auditoria
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: Rate Limiting de Webhooks (controle por IP/instância)
CREATE TABLE IF NOT EXISTS webhook_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- IP ou instance_id
    identifier_type VARCHAR(20) CHECK (identifier_type IN ('ip', 'instance')),
    window_start TIMESTAMPTZ DEFAULT NOW(),
    request_count INTEGER DEFAULT 1,
    max_requests INTEGER DEFAULT 100, -- Máximo por janela
    window_duration_seconds INTEGER DEFAULT 60, -- Duração da janela em segundos
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, identifier_type, window_start)
);

-- TABELA: Instâncias WhatsApp Permitidas (Whitelist)
CREATE TABLE IF NOT EXISTS webhook_allowed_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_name VARCHAR(255) NOT NULL,
    instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    api_key_hash VARCHAR(255) NOT NULL, -- Hash da API key (nunca armazenar plaintext)
    allowed_events TEXT[] DEFAULT ARRAY['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
    is_active BOOLEAN DEFAULT TRUE,
    ip_whitelist TEXT[] DEFAULT NULL, -- NULL = qualquer IP, array = whitelist
    max_requests_per_minute INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(instance_name)
);

-- TABELA: IPs Bloqueados Globalmente
CREATE TABLE IF NOT EXISTS webhook_blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    reason TEXT,
    blocked_until TIMESTAMPTZ, -- NULL = bloqueio permanente
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(ip_address)
);

-- ===================================================================
-- REGRAS DE SEGURANÇA PADRÃO
-- ===================================================================

-- Regra 1: IP Whitelist (vazio = sem restrição inicial)
INSERT INTO webhook_security_rules (rule_name, rule_type, priority, config) VALUES
('IP Whitelist Validation', 'ip_whitelist', 100, '{
    "enabled": true,
    "whitelist": [],
    "reject_if_empty": false
}'::jsonb)
ON CONFLICT DO NOTHING;

-- Regra 2: Validação de Instância
INSERT INTO webhook_security_rules (rule_name, rule_type, priority, config) VALUES
('Instance ID Validation', 'instance_validation', 200, '{
    "enabled": true,
    "require_valid_instance": true,
    "reject_unknown_instance": true
}'::jsonb)
ON CONFLICT DO NOTHING;

-- Regra 3: Rate Limiting
INSERT INTO webhook_security_rules (rule_name, rule_type, priority, config) VALUES
('Rate Limiting', 'rate_limit', 300, '{
    "enabled": true,
    "max_requests_per_minute": 100,
    "max_requests_per_hour": 1000,
    "block_duration_minutes": 30
}'::jsonb)
ON CONFLICT DO NOTHING;

-- Regra 4: Validação de Payload Size
INSERT INTO webhook_security_rules (rule_name, rule_type, priority, config) VALUES
('Payload Size Validation', 'signature_validation', 400, '{
    "enabled": true,
    "max_payload_size_bytes": 1048576,
    "reject_oversized": true
}'::jsonb)
ON CONFLICT DO NOTHING;

-- ===================================================================
-- ÍNDICES DE PERFORMANCE
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_webhook_audit_log_instance ON webhook_audit_log(instance_id);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_log_event ON webhook_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_log_status ON webhook_audit_log(validation_status);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_log_created ON webhook_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_identifier ON webhook_rate_limits(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window ON webhook_rate_limits(window_start);

CREATE INDEX IF NOT EXISTS idx_webhook_allowed_instances_name ON webhook_allowed_instances(instance_name);
CREATE INDEX IF NOT EXISTS idx_webhook_allowed_instances_active ON webhook_allowed_instances(is_active);

CREATE INDEX IF NOT EXISTS idx_webhook_blocked_ips_active ON webhook_blocked_ips(ip_address) WHERE is_active = true;

-- ===================================================================
-- FUNÇÃO: Atualizar timestamp updated_at
-- ===================================================================

CREATE OR REPLACE FUNCTION update_webhook_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_webhook_security_rules_updated
    BEFORE UPDATE ON webhook_security_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_security_updated_at();

CREATE TRIGGER trg_webhook_allowed_instances_updated
    BEFORE UPDATE ON webhook_allowed_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_security_updated_at();

CREATE TRIGGER trg_webhook_rate_limits_updated
    BEFORE UPDATE ON webhook_rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_security_updated_at();

-- ===================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ===================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE webhook_security_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_allowed_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_blocked_ips ENABLE ROW LEVEL SECURITY;

-- Política: Somente admins podem gerenciar regras de segurança
CREATE POLICY "Admins manage webhook security rules"
    ON webhook_security_rules
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Política: Webhook audit log é somente leitura para todos (exceto inserts)
CREATE POLICY "Service role can insert audit logs"
    ON webhook_audit_log
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view audit logs of their instances"
    ON webhook_audit_log
    FOR SELECT
    USING (
        instance_id IN (
            SELECT id FROM whatsapp_instances WHERE user_id = auth.uid()
        )
    );

-- Política: Rate limits são gerenciados pelo serviço
CREATE POLICY "Service role manages rate limits"
    ON webhook_rate_limits
    FOR ALL
    USING (true);

-- Política: Instâncias permitidas - leitura pública, escrita apenas admin
CREATE POLICY "Anyone can view allowed instances"
    ON webhook_allowed_instances
    FOR SELECT
    USING (true);

CREATE POLICY "Admins manage allowed instances"
    ON webhook_allowed_instances
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Política: IPs bloqueados - leitura pública, escrita apenas admin
CREATE POLICY "Anyone can view blocked IPs"
    ON webhook_blocked_ips
    FOR SELECT
    USING (true);

CREATE POLICY "Admins manage blocked IPs"
    ON webhook_blocked_ips
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ===================================================================
-- DADOS INICIAIS: Registrar instâncias existentes como permitidas
-- ===================================================================

-- Migrar instâncias existentes para a whitelist
INSERT INTO webhook_allowed_instances (instance_name, instance_id, api_key_hash, is_active)
SELECT 
    instance_name,
    id::uuid,
    encode(digest(api_key, 'sha256'), 'hex'),
    true
FROM whatsapp_instances
WHERE id IS NOT NULL
ON CONFLICT (instance_name) DO UPDATE
SET 
    api_key_hash = EXCLUDED.api_key_hash,
    updated_at = NOW();

-- ===================================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ===================================================================

COMMENT ON TABLE webhook_security_rules IS 'Regras de segurança para validação de webhooks (IP, instância, rate limit)';
COMMENT ON TABLE webhook_audit_log IS 'Log completo de auditoria de todos os webhooks recebidos';
COMMENT ON TABLE webhook_rate_limits IS 'Controle de rate limiting por IP ou instância';
COMMENT ON TABLE webhook_allowed_instances IS 'Whitelist de instâncias permitidas para receber webhooks';
COMMENT ON TABLE webhook_blocked_ips IS 'Lista de IPs bloqueados globalmente';

COMMENT ON COLUMN webhook_audit_log.payload_hash IS 'SHA-256 do payload para auditoria de integridade';
COMMENT ON COLUMN webhook_audit_log.processing_time_ms IS 'Tempo de processamento do webhook em milissegundos';
COMMENT ON COLUMN webhook_allowed_instances.ip_whitelist IS 'NULL = qualquer IP permitido, ARRAY = whitelist específica';

-- ===================================================================
-- MIGRAÇÃO COMPLETA
-- ===================================================================
