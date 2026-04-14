import crypto from 'crypto';
import { db } from '../db';

/**
 * Middleware de Segurança para Webhooks
 * Valida: IPs, instâncias, rate limiting, payload size e assinatura
 */

interface ValidationResult {
  valid: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * 1. Validação de IP (Whitelist/Blacklist)
 */
export async function validateIP(ip: string | null): Promise<ValidationResult> {
  if (!ip) {
    return { valid: true, reason: 'No IP provided - allowing (dev mode)' };
  }

  try {
    // Verifica se IP está na blacklist
    const blockedIP = await db.prepare(
      "SELECT * FROM webhook_blocked_ips WHERE ip_address = $1 AND is_active = true AND (blocked_until IS NULL OR blocked_until > NOW())"
    ).get(ip);

    if (blockedIP) {
      return { 
        valid: false, 
        reason: `IP ${ip} está bloqueado: ${blockedIP.reason || 'Bloqueio permanente'}`,
        metadata: { blocked_until: blockedIP.blocked_until }
      };
    }

    // Verifica regra de whitelist (se configurada)
    const whitelistRule = await db.prepare(
      "SELECT config FROM webhook_security_rules WHERE rule_type = 'ip_whitelist' AND is_active = true ORDER BY priority DESC LIMIT 1"
    ).get() as any;

    if (whitelistRule && whitelistRule.config.enabled) {
      const config = JSON.parse(whitelistRule.config);
      
      if (config.whitelist && config.whitelist.length > 0) {
        const isWhitelisted = config.whitelist.some((allowedIP: string) => {
          // Suporte a CIDR (ex: 192.168.1.0/24)
          if (allowedIP.includes('/')) {
            const [network, mask] = allowedIP.split('/');
            const ipNum = ipToInt(ip);
            const networkNum = ipToInt(network);
            const maskNum = ~((1 << (32 - parseInt(mask))) - 1);
            return (ipNum & maskNum) === (networkNum & maskNum);
          }
          return allowedIP === ip;
        });

        if (!isWhitelisted && config.reject_if_empty) {
          return { 
            valid: false, 
            reason: `IP ${ip} não está na whitelist`,
            metadata: { whitelist: config.whitelist }
          };
        }
      }
    }

    return { valid: true, reason: 'IP validado com sucesso' };
  } catch (error) {
    console.error('❌ [WEBHOOK_SECURITY] Erro na validação de IP:', error);
    return { valid: true, reason: 'Erro na validação - allow by default' };
  }
}

/**
 * 2. Validação de Instância
 */
export async function validateInstance(instanceName: string, apiKey?: string): Promise<ValidationResult> {
  try {
    const rule = await db.prepare(
      "SELECT config FROM webhook_security_rules WHERE rule_type = 'instance_validation' AND is_active = true ORDER BY priority DESC LIMIT 1"
    ).get() as any;

    if (!rule || !rule.config.enabled) {
      return { valid: true, reason: 'Validação de instância desabilitada' };
    }

    const config = JSON.parse(rule.config);

    // Verifica se instância está na whitelist
    const allowedInstance = await db.prepare(
      "SELECT * FROM webhook_allowed_instances WHERE instance_name = $1 AND is_active = true"
    ).get(instanceName) as any;

    if (!allowedInstance) {
      return { 
        valid: false, 
        reason: `Instância '${instanceName}' não está na whitelist`,
        metadata: { instance_name: instanceName }
      };
    }

    // Valida API Key (se fornecida)
    if (apiKey) {
      const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      if (apiKeyHash !== allowedInstance.api_key_hash) {
        return { 
          valid: false, 
          reason: 'API Key inválida para esta instância',
          metadata: { instance_name: instanceName }
        };
      }
    }

    // Verifica IP whitelist específica da instância
    if (allowedInstance.ip_whitelist && allowedInstance.ip_whitelist.length > 0) {
      // TODO: Passar IP para validação específica
      console.log('🔍 [WEBHOOK_SECURITY] Instância possui IP whitelist específica');
    }

    return { 
      valid: true, 
      reason: 'Instância validada com sucesso',
      metadata: { 
        instance_name: instanceName,
        allowed_events: allowedInstance.allowed_events 
      }
    };
  } catch (error) {
    console.error('❌ [WEBHOOK_SECURITY] Erro na validação de instância:', error);
    return { valid: false, reason: 'Erro interno na validação de instância' };
  }
}

/**
 * 3. Rate Limiting
 */
export async function checkRateLimit(identifier: string, type: 'ip' | 'instance'): Promise<ValidationResult> {
  try {
    const rule = await db.prepare(
      "SELECT config FROM webhook_security_rules WHERE rule_type = 'rate_limit' AND is_active = true ORDER BY priority DESC LIMIT 1"
    ).get() as any;

    if (!rule || !rule.config.enabled) {
      return { valid: true, reason: 'Rate limiting desabilitado' };
    }

    const config = JSON.parse(rule.config);
    const now = new Date();

    // Busca registro de rate limit atual
    let rateLimit = await db.prepare(
      "SELECT * FROM webhook_rate_limits WHERE identifier = $1 AND identifier_type = $2 AND window_start > $3"
    ).get(identifier, type, new Date(now.getTime() - config.window_duration_seconds * 1000)) as any;

    if (!rateLimit) {
      // Cria novo registro
      await db.prepare(
        "INSERT INTO webhook_rate_limits (identifier, identifier_type, window_start, request_count, max_requests, window_duration_seconds) VALUES ($1, $2, $3, 1, $4, $5)"
      ).run(identifier, type, now, config.max_requests_per_minute, config.window_duration_seconds);

      return { valid: true, reason: 'Novo período de rate limit iniciado' };
    }

    // Verifica se está bloqueado
    if (rateLimit.is_blocked) {
      if (rateLimit.blocked_until && new Date(rateLimit.blocked_until) > now) {
        return { 
          valid: false, 
          reason: `Rate limit excedido - bloqueado até ${rateLimit.blocked_until}`,
          metadata: { 
            blocked_until: rateLimit.blocked_until,
            current_count: rateLimit.request_count,
            max_requests: rateLimit.max_requests
          }
        };
      } else {
        // Desbloqueia automaticamente
        await db.prepare(
          "UPDATE webhook_rate_limits SET is_blocked = false, blocked_until = NULL, request_count = 1, window_start = $1 WHERE id = $2"
        ).run(now, rateLimit.id);

        return { valid: true, reason: 'Bloqueio de rate limit expirado - resetado' };
      }
    }

    // Incrementa contador
    const newCount = rateLimit.request_count + 1;

    if (newCount > rateLimit.max_requests) {
      // Bloqueia
      const blockedUntil = new Date(now.getTime() + config.block_duration_minutes * 60 * 1000);
      await db.prepare(
        "UPDATE webhook_rate_limits SET request_count = $1, is_blocked = true, blocked_until = $2, updated_at = NOW() WHERE id = $3"
      ).run(newCount, blockedUntil, rateLimit.id);

      return { 
        valid: false, 
        reason: `Rate limit excedido (${newCount}/${rateLimit.max_requests})`,
        metadata: { 
          blocked_until: blockedUntil,
          current_count: newCount,
          max_requests: rateLimit.max_requests
        }
      };
    }

    // Atualiza contador
    await db.prepare(
      "UPDATE webhook_rate_limits SET request_count = $1, updated_at = NOW() WHERE id = $2"
    ).run(newCount, rateLimit.id);

    return { 
      valid: true, 
      reason: `Rate limit OK (${newCount}/${rateLimit.max_requests})`,
      metadata: { 
        current_count: newCount,
        max_requests: rateLimit.max_requests,
        remaining: rateLimit.max_requests - newCount
      }
    };
  } catch (error) {
    console.error('❌ [WEBHOOK_SECURITY] Erro no rate limiting:', error);
    return { valid: true, reason: 'Erro no rate limit - allow by default' };
  }
}

/**
 * 4. Validação de Payload Size
 */
export function validatePayloadSize(payload: any): ValidationResult {
  try {
    const rule = db.prepare(
      "SELECT config FROM webhook_security_rules WHERE rule_type = 'signature_validation' AND is_active = true ORDER BY priority DESC LIMIT 1"
    ).get() as any;

    if (!rule || !rule.config.enabled) {
      return { valid: true, reason: 'Validação de payload desabilitada' };
    }

    const config = JSON.parse(rule.config);
    const payloadSize = JSON.stringify(payload).length;

    if (payloadSize > config.max_payload_size_bytes) {
      return { 
        valid: false, 
        reason: `Payload size excedido: ${payloadSize} bytes > ${config.max_payload_size_bytes} bytes`,
        metadata: { 
          actual_size: payloadSize,
          max_size: config.max_payload_size_bytes 
        }
      };
    }

    return { 
      valid: true, 
      reason: 'Payload size válido',
      metadata: { payload_size: payloadSize }
    };
  } catch (error) {
    console.error('❌ [WEBHOOK_SECURITY] Erro na validação de payload:', error);
    return { valid: true, reason: 'Erro na validação - allow by default' };
  }
}

/**
 * 5. Validação de Schema do Payload (evitar injeção)
 */
export function validatePayloadSchema(event: string, payload: any): ValidationResult {
  try {
    const allowedEvents = ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED', 'GROUP_UPDATE', 'PRESENCE_UPDATE'];

    if (!allowedEvents.includes(event)) {
      return { 
        valid: false, 
        reason: `Evento '${event}' não é permitido`,
        metadata: { event, allowed_events: allowedEvents }
      };
    }

    // Validação específica por evento
    if (event === 'MESSAGES_UPSERT') {
      if (!payload.data || !payload.data.key) {
        return { valid: false, reason: 'Payload MESSAGES_UPSERT inválido: missing data.key' };
      }

      // Verifica se há XSS no conteúdo
      const messageText = payload.data.message?.conversation || payload.data.message?.extendedTextMessage?.text || '';
      if (containsXSS(messageText)) {
        return { 
          valid: false, 
          reason: 'Conteúdo suspeito de XSS detectado no payload',
          metadata: { sanitized: true }
        };
      }
    }

    return { valid: true, reason: 'Schema do payload válido' };
  } catch (error) {
    console.error('❌ [WEBHOOK_SECURITY] Erro na validação de schema:', error);
    return { valid: false, reason: 'Erro na validação de schema' };
  }
}

/**
 * 6. Gera hash do payload para auditoria
 */
export function generatePayloadHash(payload: any): string {
  const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(payloadString).digest('hex');
}

/**
 * 7. Registra log de auditoria
 */
export async function logWebhookAudit(
  instanceId: string | null,
  eventType: string,
  sourceIP: string | null,
  phoneNumber: string | null,
  payloadSize: number,
  validationStatus: string,
  rejectionReason: string | null,
  processingTimeMs: number,
  payloadHash: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const id = crypto.randomUUID();
    await db.prepare(
      "INSERT INTO webhook_audit_log (id, instance_id, event_type, source_ip, phone_number, payload_size, validation_status, rejection_reason, processing_time_ms, payload_hash, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)"
    ).run(id, instanceId, eventType, sourceIP, phoneNumber, payloadSize, validationStatus, rejectionReason, processingTimeMs, payloadHash, JSON.stringify(metadata));
  } catch (error) {
    console.error('❌ [WEBHOOK_SECURITY] Erro ao registrar auditoria:', error);
  }
}

/**
 * 8. Middleware principal de segurança
 */
export async function secureWebhook(req: any, res: any, next: any): Promise<void> {
  const startTime = Date.now();
  const sourceIP = req.ip || req.connection?.remoteAddress || null;
  const payload = req.body;

  let instanceId: string | null = null;
  let instanceName: string | null = null;
  let phoneNumber: string | null = null;
  let eventType = payload.event || 'UNKNOWN';

  try {
    // 1. Validação de IP
    const ipValidation = await validateIP(sourceIP);
    if (!ipValidation.valid) {
      await logWebhookAudit(null, eventType, sourceIP, null, JSON.stringify(payload).length, 'rejected', ipValidation.reason, Date.now() - startTime, generatePayloadHash(payload), { step: 'ip_validation' });
      res.status(403).json({ 
        error: 'Forbidden', 
        reason: ipValidation.reason,
        security: true
      });
      return;
    }

    // 2. Rate Limiting por IP
    const rateLimitIP = await checkRateLimit(sourceIP, 'ip');
    if (!rateLimitIP.valid) {
      await logWebhookAudit(null, eventType, sourceIP, null, JSON.stringify(payload).length, 'blocked', rateLimitIP.reason, Date.now() - startTime, generatePayloadHash(payload), { step: 'rate_limit_ip' });
      res.status(429).json({ 
        error: 'Too Many Requests', 
        reason: rateLimitIP.reason,
        security: true
      });
      return;
    }

    // 3. Validação de Payload Size
    const payloadValidation = validatePayloadSize(payload);
    if (!payloadValidation.valid) {
      await logWebhookAudit(null, eventType, sourceIP, null, JSON.stringify(payload).length, 'rejected', payloadValidation.reason, Date.now() - startTime, generatePayloadHash(payload), { step: 'payload_size' });
      res.status(413).json({ 
        error: 'Payload Too Large', 
        reason: payloadValidation.reason,
        security: true
      });
      return;
    }

    // 4. Validação de Schema (evitar injeção)
    const schemaValidation = validatePayloadSchema(eventType, payload);
    if (!schemaValidation.valid) {
      await logWebhookAudit(null, eventType, sourceIP, null, JSON.stringify(payload).length, 'rejected', schemaValidation.reason, Date.now() - startTime, generatePayloadHash(payload), { step: 'schema_validation' });
      res.status(400).json({ 
        error: 'Invalid Payload Schema', 
        reason: schemaValidation.reason,
        security: true
      });
      return;
    }

    // 5. Extrair informações do payload
    if (payload.data) {
      instanceName = payload.data.key?.instanceName || payload.data.instanceName;
      phoneNumber = payload.data.key?.remoteJid?.replace('@s.whatsapp.net', '') || payload.data.remoteJid?.replace('@s.whatsapp.net', '');
    }

    // 6. Validação de Instância
    if (instanceName) {
      const instanceValidation = await validateInstance(instanceName, payload.apiKey);
      if (!instanceValidation.valid) {
        await logWebhookAudit(null, eventType, sourceIP, phoneNumber, JSON.stringify(payload).length, 'rejected', instanceValidation.reason, Date.now() - startTime, generatePayloadHash(payload), { step: 'instance_validation', instance_name: instanceName });
        res.status(403).json({ 
          error: 'Forbidden', 
          reason: instanceValidation.reason,
          security: true
        });
        return;
      }

      // Verifica se evento é permitido para esta instância
      if (instanceValidation.metadata?.allowed_events && !instanceValidation.metadata.allowed_events.includes(eventType)) {
        await logWebhookAudit(null, eventType, sourceIP, phoneNumber, JSON.stringify(payload).length, 'rejected', `Evento '${eventType}' não permitido para instância '${instanceName}'`, Date.now() - startTime, generatePayloadHash(payload), { step: 'event_validation', instance_name: instanceName });
        res.status(403).json({ 
          error: 'Forbidden', 
          reason: `Evento '${eventType}' não permitido para esta instância`,
          security: true
        });
        return;
      }

      // Rate Limiting por instância
      const rateLimitInstance = await checkRateLimit(instanceName, 'instance');
      if (!rateLimitInstance.valid) {
        await logWebhookAudit(null, eventType, sourceIP, phoneNumber, JSON.stringify(payload).length, 'blocked', rateLimitInstance.reason, Date.now() - startTime, generatePayloadHash(payload), { step: 'rate_limit_instance', instance_name: instanceName });
        res.status(429).json({ 
          error: 'Too Many Requests', 
          reason: rateLimitInstance.reason,
          security: true
        });
        return;
      }

      // Busca ID da instância no banco
      const instanceRecord = await db.prepare(
        "SELECT id FROM whatsapp_instances WHERE instance_name = $1"
      ).get(instanceName) as any;

      if (instanceRecord) {
        instanceId = instanceRecord.id;
      }
    }

    // 7. Registra auditoria de aprovação
    const payloadHash = generatePayloadHash(payload);
    await logWebhookAudit(
      instanceId,
      eventType,
      sourceIP,
      phoneNumber,
      JSON.stringify(payload).length,
      'approved',
      null,
      Date.now() - startTime,
      payloadHash,
      { validation_steps: ['ip', 'rate_limit_ip', 'payload_size', 'schema', 'instance', 'rate_limit_instance'] }
    );

    // Adiciona metadados de segurança ao request
    req.webhookSecurity = {
      instanceId,
      instanceName,
      phoneNumber,
      sourceIP,
      payloadHash,
      validated: true
    };

    // Próximo middleware
    next();
  } catch (error) {
    console.error('❌ [WEBHOOK_SECURITY] Erro crítico no middleware:', error);
    await logWebhookAudit(
      instanceId,
      eventType,
      sourceIP,
      phoneNumber,
      JSON.stringify(payload || {}).length,
      'rejected',
      'Erro interno no middleware de segurança',
      Date.now() - startTime,
      payload ? generatePayloadHash(payload) : 'no-payload',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
    res.status(500).json({ 
      error: 'Internal Server Error',
      security: true
    });
  }
}

// ===================================================================
// HELPERS
// ===================================================================

/**
 * Converte IP para número inteiro (para cálculos de CIDR)
 */
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => {
    return (acc << 8) + parseInt(octet, 10);
  }, 0) >>> 0;
}

/**
 * Detecta possíveis ataques XSS no payload
 */
function containsXSS(text: string): boolean {
  if (!text) return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /alert\s*\(/gi,
    /document\./gi,
    /window\./gi
  ];

  return xssPatterns.some(pattern => pattern.test(text));
}
