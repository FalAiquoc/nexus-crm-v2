import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// CRÍTICO: Forçar resolução DNS via IPv4 para evitar ENETUNREACH em VPS sem IPv6
dns.setDefaultResultOrder('ipv4first');

console.log('🔗 Iniciando Banco de Dados (Modo Resiliente)');

export let isSimulatedMode = false;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ AVISO: DATABASE_URL não definida! O sistema entrará em Modo Simulado.');
  isSimulatedMode = true;
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
    { id: 'lead-1', name: 'Carlos Mendes', email: 'carlos@email.com', phone: '(11) 99999-1111', source: 'Instagram', status: 'Novo Lead', created_at: new Date().toISOString(), custom_fields: JSON.stringify({ value: 1500, notes: 'Interessado no plano premium' }) },
    { id: 'lead-2', name: 'Ana Paula Silva', email: 'ana@email.com', phone: '(11) 99999-2222', source: 'Indicação', status: 'Contato Inicial', created_at: new Date().toISOString(), custom_fields: JSON.stringify({ value: 2500, notes: 'Indicada pelo cliente João' }) },
    { id: 'lead-3', name: 'Roberto Almeida', email: 'roberto@email.com', phone: '(11) 99999-3333', source: 'Google Ads', status: 'Proposta Enviada', created_at: new Date().toISOString(), custom_fields: JSON.stringify({ value: 3200, notes: 'Aguardando resposta' }) },
    { id: 'lead-4', name: 'Fernanda Costa', email: 'fernanda@email.com', phone: '(11) 99999-4444', source: 'Facebook', status: 'Negociação', created_at: new Date().toISOString(), custom_fields: JSON.stringify({ value: 4800, notes: 'Quer desconto de 10%' }) },
    { id: 'lead-5', name: 'Lucas Oliveira', email: 'lucas@email.com', phone: '(11) 99999-5555', source: 'Instagram', status: 'Fechado', created_at: new Date().toISOString(), custom_fields: JSON.stringify({ value: 5000, notes: 'Cliente fidelizado' }) },
    { id: 'lead-6', name: 'Mariana Santos', email: 'mariana@email.com', phone: '(11) 99999-6666', source: 'Indicação', status: 'Fechado', created_at: new Date().toISOString(), custom_fields: JSON.stringify({ value: 3500, notes: 'Plano anual' }) },
    { id: 'lead-7', name: 'Pedro Henrique', email: 'pedro@email.com', phone: '(11) 99999-7777', source: 'Google Ads', status: 'Contato Inicial', created_at: new Date().toISOString(), custom_fields: JSON.stringify({ value: 2000, notes: 'Primeiro contato' }) },
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
  access_requests: []
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
      if (lowerSql.includes('update settings')) {
        const [value, key] = params;
        const index = (MOCK_DATA.settings || []).findIndex((s: any) => s.key === key);
        if (index !== -1) MOCK_DATA.settings[index].value = value;
        else MOCK_DATA.settings.push({ key, value });
      }
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
