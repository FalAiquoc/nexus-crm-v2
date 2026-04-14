# 🔒 SEGURANÇA DE WEBHOOKS - Nexus CRM v2

**Data:** 2026-04-14  
**Versão:** 1.0  
**Autor:** Sistema de Refatoração Sistêmica

---

## 📋 VISÃO GERAL

O sistema de segurança de webhooks foi implementado para proteger o Nexus CRM v2 contra ataques, spam e processamento de dados não autorizados via Evolution API.

### **Problemas Resolvidos:**
1. ❌ **Webhooks sem validação de origem** → Qualquer IP podia enviar dados
2. ❌ **Sem controle de rate limiting** → Possível ataque DDoS via webhooks
3. ❌ **Instâncias não validadas** → Webhooks de instâncias não autorizadas eram processados
4. ❌ **Payload sem validação** → Possível injeção de XSS/SQL
5. ❌ **Sem auditoria** → Não havia log de quais webhooks foram recebidos/rejeitados
6. ❌ **IPs não bloqueáveis** → Sem mecanismo para bloquear origens maliciosas

---

## 🏗️ ARQUITETURA DE SEGURANÇA

### **Camadas de Validação (6 Camadas)**

```
Webhook Recebido
    ↓
[1] Validação de IP (Whitelist/Blacklist)
    ↓ ✅
[2] Rate Limiting por IP
    ↓ ✅
[3] Validação de Payload Size (max 1MB)
    ↓ ✅
[4] Validação de Schema (XSS/SQL Injection)
    ↓ ✅
[5] Validação de Instância (Whitelist + API Key)
    ↓ ✅
[6] Rate Limiting por Instância
    ↓ ✅
[7] Blacklist de Números
    ↓ ✅
Processamento Normal
```

---

## 📊 TABELAS DE SEGURANÇA

### **1. webhook_security_rules**
Regras de segurança configuráveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| rule_name | VARCHAR(255) | Nome da regra |
| rule_type | VARCHAR(50) | Tipo: `ip_whitelist`, `instance_validation`, `rate_limit`, `signature_validation` |
| is_active | BOOLEAN | Se a regra está ativa |
| priority | INTEGER | Prioridade (maior = mais prioritário) |
| config | JSONB | Configuração da regra |

**Regras Padrão:**
```sql
-- IP Whitelist (desabilitada por padrão - permitir todos)
{ enabled: true, whitelist: [], reject_if_empty: false }

-- Validação de Instância (obrigatória)
{ enabled: true, require_valid_instance: true, reject_unknown_instance: true }

-- Rate Limiting
{ enabled: true, max_requests_per_minute: 100, max_requests_per_hour: 1000, block_duration_minutes: 30 }

-- Payload Size
{ enabled: true, max_payload_size_bytes: 1048576, reject_oversized: true }
```

---

### **2. webhook_audit_log**
Log completo de TODOS os webhooks recebidos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| instance_id | UUID | Instância WhatsApp (FK) |
| event_type | VARCHAR(100) | Tipo de evento: `MESSAGES_UPSERT`, `CONNECTION_UPDATE`, etc |
| source_ip | INET | IP de origem |
| phone_number | VARCHAR(20) | Número envolvido |
| payload_size | INTEGER | Tamanho do payload em bytes |
| validation_status | VARCHAR(50) | `approved`, `rejected`, `blocked` |
| rejection_reason | TEXT | Motivo da rejeição |
| processing_time_ms | INTEGER | Tempo de processamento |
| payload_hash | VARCHAR(64) | SHA-256 do payload |
| metadata | JSONB | Metadados adicionais |

**Exemplo de Query:**
```sql
-- Webhooks rejeitados nas últimas 24h
SELECT * FROM webhook_audit_log 
WHERE validation_status = 'rejected' 
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Top IPs por número de webhooks
SELECT source_ip, COUNT(*) as count 
FROM webhook_audit_log 
GROUP BY source_ip 
ORDER BY count DESC 
LIMIT 10;
```

---

### **3. webhook_rate_limits**
Controle de rate limiting por IP ou instância.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| identifier | VARCHAR(255) | IP ou nome da instância |
| identifier_type | VARCHAR(20) | `ip` ou `instance` |
| window_start | TIMESTAMPTZ | Início da janela |
| request_count | INTEGER | Requisições na janela atual |
| max_requests | INTEGER | Máximo permitido |
| window_duration_seconds | INTEGER | Duração da janela (padrão: 60s) |
| is_blocked | BOOLEAN | Se está bloqueado |
| blocked_until | TIMESTAMPTZ | Fim do bloqueio |

**Comportamento:**
- Quando `request_count > max_requests` → IP/instância é bloqueado
- Bloqueio dura `block_duration_minutes` (padrão: 30 min)
- Após bloqueio expirar → contador é resetado

---

### **4. webhook_allowed_instances**
Whitelist de instâncias permitidas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| instance_name | VARCHAR(255) | Nome da instância |
| instance_id | UUID | FK para whatsapp_instances |
| api_key_hash | VARCHAR(255) | SHA-256 da API key |
| allowed_events | TEXT[] | Eventos permitidos: `['MESSAGES_UPSERT', 'CONNECTION_UPDATE']` |
| is_active | BOOLEAN | Se está ativa |
| ip_whitelist | TEXT[] | IPs permitidos para esta instância (NULL = qualquer) |
| max_requests_per_minute | INTEGER | Rate limit específico |

**Exemplo:**
```sql
-- Adicionar instância permitida
INSERT INTO webhook_allowed_instances (instance_name, instance_id, api_key_hash, allowed_events, is_active)
VALUES (
  'nexus-crm',
  'uuid-da-instancia',
  encode(digest('api-key-secreta', 'sha256'), 'hex'),
  ARRAY['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
  true
);
```

---

### **5. webhook_blocked_ips**
Lista de IPs bloqueados globalmente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| ip_address | INET | IP bloqueado |
| reason | TEXT | Motivo do bloqueio |
| blocked_until | TIMESTAMPTZ | Fim do bloqueio (NULL = permanente) |
| is_active | BOOLEAN | Se bloqueio está ativo |

**Exemplo:**
```sql
-- Bloquear IP malicioso
INSERT INTO webhook_blocked_ips (ip_address, reason, blocked_until)
VALUES ('203.0.113.42', 'Tentativa de injeção de XSS', NULL);
```

---

## 🔧 MIDDLEWARE DE SEGURANÇA

### **Arquivo:** `server/middleware/webhook.security.ts`

### **Funções Exportadas:**

#### **1. validateIP(ip: string)**
Valida IP contra whitelist/blacklist.

```typescript
const result = await validateIP('203.0.113.42');
if (!result.valid) {
  console.log('IP bloqueado:', result.reason);
}
```

#### **2. validateInstance(instanceName: string, apiKey?: string)**
Valida instância contra whitelist e API key.

```typescript
const result = await validateInstance('nexus-crm', 'api-key-secreta');
if (!result.valid) {
  console.log('Instância inválida:', result.reason);
}
```

#### **3. checkRateLimit(identifier: string, type: 'ip' | 'instance')**
Verifica e atualiza rate limiting.

```typescript
const result = await checkRateLimit('203.0.113.42', 'ip');
if (!result.valid) {
  console.log('Rate limit excedido:', result.reason);
}
```

#### **4. validatePayloadSize(payload: any)**
Valida tamanho do payload (max 1MB).

```typescript
const result = validatePayloadSize(body);
if (!result.valid) {
  console.log('Payload muito grande:', result.reason);
}
```

#### **5. validatePayloadSchema(event: string, payload: any)**
Valida schema e detecta XSS/SQL injection.

```typescript
const result = validatePayloadSchema('MESSAGES_UPSERT', body);
if (!result.valid) {
  console.log('Schema inválido:', result.reason);
}
```

#### **6. logWebhookAudit(...)**
Registra log de auditoria.

```typescript
await logWebhookAudit(
  instanceId: 'uuid',
  eventType: 'MESSAGES_UPSERT',
  sourceIP: '203.0.113.42',
  phoneNumber: '5511999999999',
  payloadSize: 1024,
  validationStatus: 'approved',
  rejectionReason: null,
  processingTimeMs: 45,
  payloadHash: 'sha256-hash',
  metadata: { step: 'processing' }
);
```

#### **7. generatePayloadHash(payload: any): string**
Gera SHA-256 do payload para auditoria.

```typescript
const hash = generatePayloadHash(body);
// => 'a1b2c3d4e5f6...'
```

---

## 🚀 COMO USAR

### **No server.ts (já implementado):**

```typescript
app.post("/api/webhook/whatsapp", async (req, res) => {
  const startTime = Date.now();
  const body = req.body;
  const sourceIP = req.ip || req.connection?.remoteAddress;

  // 1. Validação de IP
  const ipValidation = await validateIP(sourceIP);
  if (!ipValidation.valid) {
    return res.status(403).json({ error: 'Forbidden', reason: ipValidation.reason });
  }

  // 2. Rate Limiting
  const rateLimitIP = await checkRateLimit(sourceIP, 'ip');
  if (!rateLimitIP.valid) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }

  // 3. Validação de Payload
  const payloadValidation = validatePayloadSize(body);
  if (!payloadValidation.valid) {
    return res.status(413).json({ error: 'Payload Too Large' });
  }

  // 4. Validação de Schema
  const schemaValidation = validatePayloadSchema(body.event, body);
  if (!schemaValidation.valid) {
    return res.status(400).json({ error: 'Invalid Payload' });
  }

  // 5. Validação de Instância
  const instanceValidation = await validateInstance(instanceName, body.apiKey);
  if (!instanceValidation.valid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 6. Processar normalmente...
});
```

---

## 📈 MONITORAMENTO

### **Queries Úteis:**

```sql
-- Webhooks por status (últimas 24h)
SELECT validation_status, COUNT(*) as count
FROM webhook_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY validation_status;

-- Instâncias com mais rejeições
SELECT 
  webhook_audit_log.instance_id,
  whatsapp_instances.instance_name,
  COUNT(*) as rejection_count
FROM webhook_audit_log
LEFT JOIN whatsapp_instances ON webhook_audit_log.instance_id = whatsapp_instances.id
WHERE webhook_audit_log.validation_status = 'rejected'
GROUP BY webhook_audit_log.instance_id, whatsapp_instances.instance_name
ORDER BY rejection_count DESC;

-- IPs bloqueados atualmente
SELECT * FROM webhook_rate_limits
WHERE is_blocked = true
AND blocked_until > NOW();
```

---

## 🔒 POLÍTICAS DE SEGURANÇA

### **RLS (Row Level Security)**

Todas as tabelas possuem RLS habilitado:

```sql
-- Admins gerenciam regras
CREATE POLICY "Admins manage webhook security rules"
    ON webhook_security_rules
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Service role registra logs
CREATE POLICY "Service role can insert audit logs"
    ON webhook_audit_log
    FOR INSERT
    WITH CHECK (true);

-- Usuários veem logs de suas instâncias
CREATE POLICY "Users can view audit logs of their instances"
    ON webhook_audit_log
    FOR SELECT
    USING (
        instance_id IN (
            SELECT id FROM whatsapp_instances WHERE user_id = auth.uid()
        )
    );
```

---

## 🚨 RESPONDENDO A INCIDENTES

### **Cenário 1: IP Malicioso**

```sql
-- 1. Bloquear IP imediatamente
INSERT INTO webhook_blocked_ips (ip_address, reason, blocked_until)
VALUES ('203.0.113.42', 'Tentativa de injeção', NULL);

-- 2. Verificar histórico de webhooks deste IP
SELECT * FROM webhook_audit_log
WHERE source_ip = '203.0.113.42'
ORDER BY created_at DESC;

-- 3. Se necessário, limpar dados processados
DELETE FROM leads WHERE phone IN (
  SELECT phone_number FROM webhook_audit_log
  WHERE source_ip = '203.0.113.42'
  AND created_at > NOW() - INTERVAL '1 hour'
);
```

### **Cenário 2: Instância Comprometida**

```sql
-- 1. Desativar instância na whitelist
UPDATE webhook_allowed_instances
SET is_active = false
WHERE instance_name = 'instancia-comprometida';

-- 2. Verificar webhooks processados
SELECT * FROM webhook_audit_log
WHERE instance_id = 'uuid-da-instancia'
ORDER BY created_at DESC;

-- 3. Rotacionar API key
UPDATE whatsapp_instances
SET api_key = encode(gen_random_bytes(32), 'hex')
WHERE instance_name = 'instancia-comprometida';
```

### **Cenário 3: Rate Limit Excedido**

```sql
-- 1. Verificar quem está sendo bloqueado
SELECT * FROM webhook_rate_limits
WHERE is_blocked = true;

-- 2. Desbloquear manualmente (se necessário)
UPDATE webhook_rate_limits
SET is_blocked = false, blocked_until = NULL, request_count = 0
WHERE identifier = '203.0.113.42';

-- 3. Ajustar limite se necessário
UPDATE webhook_security_rules
SET config = jsonb_set(config, '{max_requests_per_minute}', '200'::jsonb)
WHERE rule_type = 'rate_limit';
```

---

## 📝 CHECKLIST DE DEPLOY

- [x] Migration SQL executada (`001_webhook_security_rules.sql`)
- [x] Middleware criado (`server/middleware/webhook.security.ts`)
- [x] server.ts atualizado com validação
- [x] db.ts atualizado com mock data
- [ ] **Instâncias existentes migradas para whitelist** (automático via migrations)
- [ ] **IPs da Evolution API adicionados à whitelist** (se necessário)
- [ ] **Monitoramento configurado** (alerts para webhooks rejeitados)
- [ ] **Testes E2E executados** (validar que webhooks legítimos passam)

---

## 🎯 PRÓXIMOS PASSOS

1. **Webhook Signature Validation**: Implementar HMAC-SHA256 para validar assinatura do payload
2. **IP Whitelist Automático**: Detectar IPs da Evolution API e adicionar automaticamente
3. **Alertas em Tempo Real**: Notificar admin quando webhook for rejeitado
4. **Dashboard de Auditoria**: UI para visualizar logs de webhook_audit_log
5. **Rate Limiting Dinâmico**: Ajustar limites baseado em comportamento histórico

---

**Documento gerado automaticamente em 2026-04-14**  
**Nexus CRM v2 - Security First Architecture**
