import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// CRÍTICO: Forçar resolução DNS via IPv4 para evitar ENETUNREACH em VPS sem IPv6
dns.setDefaultResultOrder('ipv4first');

console.log('🔗 Iniciando Banco de Dados (Modo Resiliente)');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export let isSimulatedMode = false;

export const setSimulatedMode = (mode: boolean) => {
  // Proibir modo simulado em produção para evitar poluição de dados fakes
  isSimulatedMode = IS_PRODUCTION ? false : mode;
  console.log(isSimulatedMode ? '🧪 [DATABASE] MANUAL OVERRIDE: MODO SIMULADO LIGADO!' : '🌍 [DATABASE] MANUAL OVERRIDE: MODO REAL LIGADO!');
};

if (!process.env.DATABASE_URL && !IS_PRODUCTION) {
  console.warn('⚠️ AVISO: DATABASE_URL não definida! O sistema entrará em Modo Simulado.');
  isSimulatedMode = true;
} else if (!process.env.DATABASE_URL && IS_PRODUCTION) {
  console.error('❌ ERRO CRÍTICO: DATABASE_URL ausente em PRODUÇÃO! O sistema poderá falhar.');
}

const dbConfig: any = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:senha_provisoria_2026@banco-dados-provisorio:5432/provisorio_db',
  // SSL obrigatório para Supabase Cloud
  ssl: process.env.DATABASE_URL?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
};

let pool: any = null;

// Mock Data Store (In-Memory) - Fallback apenas se DATABASE_URL ausente
const MOCK_DATA: any = {
  users: [
    { id: 'admin-diogo', name: 'Diogo Admin', email: 'diogo@dvadvoga.com.br', password: bcrypt.hashSync('admin123', 10), role: 'admin' }
  ],
  leads: [
    { id: 'lead-1', name: 'Carlos Mendes', email: 'carlos@email.com', phone: '(11) 99999-1111', source: 'Instagram', status: 'Novo Lead', created_at: '2026-01-15T10:00:00Z', custom_fields: JSON.stringify({ value: 15200, notes: 'Interessado no plano premium' }), is_mock: true },
    { id: 'lead-2', name: 'Ana Paula Silva', email: 'ana@email.com', phone: '(11) 99999-2222', source: 'Indicação', status: 'Contato Inicial', created_at: '2026-02-20T14:30:00Z', custom_fields: JSON.stringify({ value: 25000, notes: 'Indicada pelo cliente João' }), is_mock: true },
    { id: 'lead-3', name: 'Roberto Almeida', email: 'roberto@email.com', phone: '(11) 99999-3333', source: 'Google Ads', status: 'Proposta Enviada', created_at: '2026-03-05T09:15:00Z', custom_fields: JSON.stringify({ value: 32000, notes: 'Aguardando resposta' }), is_mock: true },
    { id: 'lead-4', name: 'Fernanda Costa', email: 'fernanda@email.com', phone: '(11) 99999-4444', source: 'Facebook', status: 'Negociação', created_at: '2026-04-01T11:45:00Z', custom_fields: JSON.stringify({ value: 48000, notes: 'Quer desconto de 10%' }), is_mock: true },
    { id: 'lead-5', name: 'Lucas Oliveira', email: 'lucas@email.com', phone: '(11) 99999-5555', source: 'Instagram', status: 'Fechado', created_at: '2026-04-10T16:20:00Z', custom_fields: JSON.stringify({ value: 55000, notes: 'Cliente fidelizado' }), is_mock: true },
    { id: 'lead-6', name: 'Mariana Santos', email: 'mariana@email.com', phone: '(11) 99999-6666', source: 'Indicação', status: 'Fechado', created_at: '2025-12-20T10:00:00Z', custom_fields: JSON.stringify({ value: 135000, notes: 'Plano anual' }), is_mock: true },
    { id: 'lead-7', name: 'Pedro Henrique', email: 'pedro@email.com', phone: '(11) 99999-7777', source: 'Google Ads', status: 'Contato Inicial', created_at: '2026-04-05T08:00:00Z', custom_fields: JSON.stringify({ value: 22000, notes: 'Primeiro contato' }), is_mock: true },
    { id: 'lead-8', name: 'Julia Medeiros', email: 'julia@email.com', phone: '(11) 99988-7777', source: 'WhatsApp', status: 'Fechado', created_at: '2026-03-28T08:00:00Z', custom_fields: JSON.stringify({ value: 120500, notes: 'Contrato Assinado' }), is_mock: true },
    { id: 'lead-9', name: 'Marcos Braz', email: 'braz@email.com', phone: '(11) 91111-7777', source: 'Facebook', status: 'Perdido', created_at: '2026-02-10T08:00:00Z', custom_fields: JSON.stringify({ value: 45000, notes: 'Achou caro' }), is_mock: true },
  ],
  pipelines: [
    { id: 'pipe-1', name: 'Pipeline Principal', is_default: true, created_at: new Date().toISOString() }
  ],
  stages: [
    { id: 'stage-1', pipeline_id: 'pipe-1', name: 'Novo Lead', sort_order: 0, color: '#6366F1' },
    { id: 'stage-2', pipeline_id: 'pipe-1', name: 'Contato Inicial', sort_order: 1, color: '#8B5CF6' },
    { id: 'stage-3', pipeline_id: 'pipe-1', name: 'Proposta Enviada', sort_order: 2, color: '#EC4899' },
    { id: 'stage-4', pipeline_id: 'pipe-1', name: 'Negociação', sort_order: 3, color: '#F59E0B' },
    { id: 'stage-5', pipeline_id: 'pipe-1', name: 'Fechado', sort_order: 4, color: '#10B981' },
    { id: 'stage-6', pipeline_id: 'pipe-1', name: 'Perdido', sort_order: 5, color: '#EF4444' },
  ],
  settings: [
    { key: 'workspace_type', value: 'general' },
    { key: 'business_name', value: 'CRM DoBoy' },
    { key: 'active_theme', value: 'ouro-negro' },
    { key: 'sidebar_mode', value: 'auto' },
    { key: 'ui_density', value: 'comfortable' },
  ],
  appointments: [],
  plans: [],
  subscriptions: [],
  access_requests: [],
  automation_rules: [
    {
      id: '1',
      name: 'Boas-vindas Novos Leads (Simulado)',
      trigger_name: 'Lead Criado',
      status: 'active',
      last_run: '2026-04-07T10:00:00Z',
      steps: JSON.stringify([
        { id: 's1', type: 'trigger', title: 'Novo Lead', description: 'Quando um lead for criado no sistema', icon: 'user' },
        { id: 's2', type: 'action', title: 'Enviar WhatsApp', description: 'Mensagem de boas-vindas inicial', icon: 'message-circle', config: { action_type: 'whatsapp', message: 'Olá! Bem-vindo ao nosso sistema! Como podemos ajudar?' } }
      ]),
      user_id: 'admin-diogo',
      is_mock: true,
      integration_config: JSON.stringify({})
    },
    {
      id: '2',
      name: 'Follow-up após 2 dias (Simulado)',
      trigger_name: 'Lead Criado',
      status: 'active',
      last_run: '2026-04-08T14:00:00Z',
      steps: JSON.stringify([
        { id: 's1', type: 'trigger', title: 'Novo Lead', description: 'Quando um lead for criado', icon: 'user' },
        { id: 's2', type: 'delay', title: 'Esperar 2 dias', description: 'Aguardar 48 horas', icon: 'clock', config: { duration_seconds: 172800 } },
        { id: 's3', type: 'action', title: 'Enviar Follow-up', description: 'Mensagem de follow-up via WhatsApp', icon: 'message-circle', config: { action_type: 'whatsapp', message: 'Olá! Gostaria de saber se você teve alguma dúvida sobre nossos serviços?' } }
      ]),
      user_id: 'admin-diogo',
      is_mock: true,
      integration_config: JSON.stringify({})
    }
  ],
  whatsapp_instances: [],
  whatsapp_messages: [],
  automation_logs: []
};

try {
  if (process.env.DATABASE_URL) {
    pool = new Pool(dbConfig);
    pool.on('error', (err: any) => {
      console.error('❌ Erro Crítico no Pool do Postgres:', err.message);
      // Não forçamos isSimulatedMode = true aqui para permitir reconexão automática do pool
    });
  } else {
    isSimulatedMode = true;
    console.warn('🧪 [DATABASE] Iniciando em MODO SIMULADO (Sem DATABASE_URL)');
  }
} catch (e) {
  isSimulatedMode = true;
}

const db: any = {};

const toPgSql = (sql: string) => {
  let count = 0;
  return sql.replace(/\?/g, () => `$${++count}`);
};

db.query = async (sql: string, params: any[] = []) => {
  if (isSimulatedMode) return { rows: [] };
  try {
    return await pool.query(sql, params);
  } catch (err: any) {
    console.error(`🔥 Erro na query SQL: ${err.message}`);
    return { rows: [] };
  }
};

db.prepare = (sql: string) => ({
  get: async (...params: any[]) => {
    if (isSimulatedMode) {
      const lowerSql = sql.toLowerCase();
      if (lowerSql.includes('from users where email =')) return MOCK_DATA.users.find((u: any) => u.email === params[0]);
      if (lowerSql.includes('from users where id =')) return MOCK_DATA.users.find((u: any) => u.id === params[0]);
      if (lowerSql.includes('from settings where key =')) return MOCK_DATA.settings.find((s: any) => s.key === params[0]);
      return null;
    }
    const pgSql = toPgSql(sql);
    try {
      const res = await pool.query(pgSql, params);
      return res.rows[0];
    } catch (err: any) {
      console.error(`🔥 [DB_GET_ERROR] ${err.message} | SQL: ${sql}`);
      return null;
    }
  },
  all: async (...params: any[]) => {
    if (isSimulatedMode) {
      const lowerSql = sql.toLowerCase();
      if (lowerSql.includes('from settings')) return MOCK_DATA.settings;
      if (lowerSql.includes('from leads')) return MOCK_DATA.leads;
      if (lowerSql.includes('from appointments')) return MOCK_DATA.appointments;
      if (lowerSql.includes('from plans')) return MOCK_DATA.plans;
      if (lowerSql.includes('from subscriptions')) return MOCK_DATA.subscriptions;
      if (lowerSql.includes('from access_requests')) return MOCK_DATA.access_requests;
      if (lowerSql.includes('from pipelines')) return MOCK_DATA.pipelines;
      if (lowerSql.includes('from automation_rules')) return MOCK_DATA.automation_rules;
      if (lowerSql.includes('from whatsapp_instances')) return MOCK_DATA.whatsapp_instances;
      if (lowerSql.includes('from whatsapp_messages')) return MOCK_DATA.whatsapp_messages;
      if (lowerSql.includes('from automation_logs')) return MOCK_DATA.automation_logs;
      if (lowerSql.includes('from stages')) {
        const pipelineId = params[0];
        return MOCK_DATA.stages.filter((s: any) => s.pipeline_id === pipelineId);
      }
      return [];
    }
    const pgSql = toPgSql(sql);
    try {
      const res = await pool.query(pgSql, params);
      return res.rows;
    } catch (err: any) {
      console.error(`🔥 [DB_ALL_ERROR] ${err.message} | SQL: ${sql}`);
      return [];
    }
  },
  run: async (...params: any[]) => {
    if (isSimulatedMode) {
      const lowerSql = sql.toLowerCase();
      // Simulação de escrita em memória com suporte a is_mock
      if (lowerSql.includes('insert into leads')) {
        const [id, name, email, phone, source, status, custom_fields, is_mock] = params;
        MOCK_DATA.leads.push({ id, name, email, phone, source, status, created_at: new Date().toISOString(), custom_fields, is_mock: is_mock || false });
      }
      if (lowerSql.includes('update leads')) {
        const [name, email, phone, source, status, custom_fields, is_mock, id] = params;
        const idx = MOCK_DATA.leads.findIndex((l: any) => l.id === id);
        if (idx !== -1) {
          MOCK_DATA.leads[idx] = { ...MOCK_DATA.leads[idx], name, email, phone, source, status, custom_fields, is_mock: is_mock || false };
        }
      }
      if (lowerSql.includes('insert into automation_rules')) {
        const [id, name, trigger, status, steps, user_id, integration_config, is_mock] = params;
        MOCK_DATA.automation_rules.push({
          id,
          name,
          trigger_name: trigger,
          status,
          steps,
          user_id,
          integration_config: integration_config || JSON.stringify({}),
          is_mock: is_mock || false,
          last_run: '-'
        });
      }

      if (lowerSql.includes('insert into whatsapp_instances')) {
        const [id, name, instance_name, api_key, status, user_id, is_mock] = params;
        MOCK_DATA.whatsapp_instances.push({
          id, name, instance_name, api_key, status, user_id, is_mock,
          webhook_url: null, connection_status: JSON.stringify({}),
          created_at: new Date().toISOString()
        });
      }

      if (lowerSql.includes('insert into whatsapp_messages')) {
        const [id, instance_id, direction, phone_number, message_type, content, status, created_at] = params;
        MOCK_DATA.whatsapp_messages.push({
          id, instance_id, direction, phone_number, message_type, content, status,
          created_at: created_at || new Date().toISOString(),
          metadata: JSON.stringify({})
        });
      }

      if (lowerSql.includes('insert into automation_logs')) {
        MOCK_DATA.automation_logs.push({
          id: params[0],
          automation_id: params[1],
          trigger_data: params[2],
          execution_status: params[3] || 'running',
          steps_executed: params[4] || 0,
          steps_total: params[5] || 0,
          error_message: params[6] || null,
          started_at: params[7] || new Date().toISOString(),
          completed_at: params[8] || null
        });
      }
      if (lowerSql.includes('update settings')) {
        const [value, key] = params;
        const index = (MOCK_DATA.settings || []).findIndex((s: any) => s.key === key);
        if (index !== -1) MOCK_DATA.settings[index].value = value;
        else MOCK_DATA.settings.push({ key, value });
      }
      if (lowerSql.includes('update automation_rules')) {
        const [name, trigger, status, steps, id, user_id] = params;
        const idx = MOCK_DATA.automation_rules.findIndex((r: any) => r.id === id);
        if (idx !== -1) {
          MOCK_DATA.automation_rules[idx] = {
            ...MOCK_DATA.automation_rules[idx],
            name,
            trigger_name: trigger,
            status,
            steps
          };
        }
      }

      if (lowerSql.includes('update whatsapp_instances')) {
        const idx = MOCK_DATA.whatsapp_instances.findIndex((w: any) => w.id === params[params.length - 1] || w.instance_name === params[params.length - 1]);
        if (idx !== -1) {
          // Atualiza campos dinamicamente
          if (params[0]) MOCK_DATA.whatsapp_instances[idx].status = params[0];
          if (params[1]) MOCK_DATA.whatsapp_instances[idx].connection_status = params[1];
          if (params[2]) MOCK_DATA.whatsapp_instances[idx].webhook_url = params[2];
        }
      }

      if (lowerSql.includes('update automation_logs')) {
        const idx = MOCK_DATA.automation_logs.findIndex((l: any) => l.id === params[params.length - 1]);
        if (idx !== -1) {
          if (params[0] !== undefined) MOCK_DATA.automation_logs[idx].steps_executed = params[0];
          if (params[1]) MOCK_DATA.automation_logs[idx].execution_status = params[1];
          if (params[2]) MOCK_DATA.automation_logs[idx].error_message = params[2];
          if (params[3]) MOCK_DATA.automation_logs[idx].completed_at = params[3];
        }
      }
      if (lowerSql.includes('delete from leads')) {
        MOCK_DATA.leads = [];
      }
      if (lowerSql.includes('delete from appointments')) {
        MOCK_DATA.appointments = [];
      }
      if (lowerSql.includes('delete from automation_rules')) {
        const id = params[0];
        // Se houver ID, deleta um, senão limpa tudo (limpeza geral)
        if (id) {
          MOCK_DATA.automation_rules = MOCK_DATA.automation_rules.filter((r: any) => r.id !== id);
        } else {
          MOCK_DATA.automation_rules = [];
        }
      }

      if (lowerSql.includes('delete from whatsapp_instances')) {
        const id = params[0];
        if (id) {
          MOCK_DATA.whatsapp_instances = MOCK_DATA.whatsapp_instances.filter((w: any) => w.id !== id);
        } else {
          MOCK_DATA.whatsapp_instances = [];
        }
      }

      if (lowerSql.includes('delete from whatsapp_messages')) {
        const id = params[0];
        if (id) {
          MOCK_DATA.whatsapp_messages = MOCK_DATA.whatsapp_messages.filter((m: any) => m.id !== id);
        } else {
          MOCK_DATA.whatsapp_messages = [];
        }
      }
      console.log(`🧪 [SIMULATED_WRITE/DELETE] SQL: ${sql.substring(0, 50)}...`);
      return { rowCount: 1 };
    }
    const pgSql = toPgSql(sql);
    try {
      return await pool.query(pgSql, params);
    } catch (err: any) {
      console.error(`🔥 [DB_RUN_ERROR] ${err.message} | SQL: ${sql}`);
      return { rowCount: 0 };
    }
  }
});

db.exec = async (sql: string) => {
  if (isSimulatedMode) return;
  try {
    await pool.query(sql);
  } catch (e: any) {
    console.error(`🔥 [DB_EXEC_ERROR] ${e.message}`);
  }
};

export async function initializeDatabase() {
  if (isSimulatedMode || !pool) {
    console.log('✅ Nexus CRM operando em MODO SIMULADO (Simulated Mode).');
    return;
  }
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com Banco de Dados estabelecida com sucesso!');
    client.release();
  } catch (err) {
    console.warn('⚠️ Falha ao conectar ao Banco Real. Ativando MODO SIMULADO.');
    isSimulatedMode = true;
  }
}

export default db;
