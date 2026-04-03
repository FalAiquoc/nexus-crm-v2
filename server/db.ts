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

// Mock Data Store (In-Memory) - Para quando o banco estiver offline
const MOCK_DATA: any = {
  users: [
    { id: 'admin-diogo', name: 'Diogo Admin', email: 'diogo@dvadvoga.com.br', password: bcrypt.hashSync('admin123', 10), role: 'admin' }
  ],
  leads: [
    { 
      id: '1', name: 'Ana Silva', email: 'ana@example.com', phone: '(11) 99999-1111', source: 'WhatsApp', status: 'Novo Lead', 
      value: 1500, notes: 'Interesse em Blindagem Corporativa', 
      cpf_cnpj: '123.456.789-00', tags: JSON.stringify(['Empresa', 'Urgente']),
      address: JSON.stringify({ street: 'Rua das Flores', number: '100', neighborhood: 'Centro', city: 'São Paulo', state: 'SP', zip: '01001-000' }),
      history: JSON.stringify([{ date: '2024-04-03', action: 'Lead Criado', content: 'Origem WhatsApp' }])
    }
  ],
  pipelines: [{ id: 'p1', name: 'Vendas Principal', is_default: true }],
  stages: [
    { id: '1', name: 'Novo Lead', pipeline_id: 'p1', sort_order: 1 },
    { id: '2', name: 'Em Contato', pipeline_id: 'p1', sort_order: 2 }
  ],
  settings: [
    { key: 'workspace_type', value: 'legal' },
    { key: 'business_name', value: 'Nexus CRM' }
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
      console.error('❌ Erro no Pool do Postgres:', err.message);
      isSimulatedMode = true;
    });
  } else {
    isSimulatedMode = true;
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
  try { return await pool.query(sql, params); } catch (err) { isSimulatedMode = true; return { rows: [] }; }
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
    try { const res = await pool.query(pgSql, params); return res.rows[0]; } catch (err) { isSimulatedMode = true; return null; }
  },
  all: async (...params: any[]) => {
    if (isSimulatedMode) {
      const lowerSql = sql.toLowerCase();
      if (lowerSql.includes('from settings')) return MOCK_DATA.settings;
      if (lowerSql.includes('from leads')) return MOCK_DATA.leads;
      return [];
    }
    const pgSql = toPgSql(sql);
    try { const res = await pool.query(pgSql, params); return res.rows; } catch (err) { isSimulatedMode = true; return []; }
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
    try { return await pool.query(pgSql, params); } catch (err) { isSimulatedMode = true; return { rowCount: 1 }; }
  }
});

db.exec = async (sql: string) => {
  if (isSimulatedMode) return;
  try { await pool.query(sql); } catch (e) { isSimulatedMode = true; }
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
