import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'crm.db'));

// Fase 2 - Planejamento do Banco de Dados (Schema Inicial)
db.exec(`
  -- Tabela de Usuários / Equipe
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'vendedor', -- admin, gestor, vendedor
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de Empresas
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    segment TEXT,
    size TEXT,
    address TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de Leads / Contatos
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    source TEXT,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Novo Lead',
    company_id TEXT,
    custom_fields TEXT, -- JSON para flexibilidade
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  -- Tabela de Funis
  CREATE TABLE IF NOT EXISTS pipelines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de Etapas do Funil
  CREATE TABLE IF NOT EXISTS stages (
    id TEXT PRIMARY KEY,
    pipeline_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    required_fields TEXT, -- JSON array de campos obrigatórios
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)
  );

  -- Tabela de Negociações (Deals)
  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    value REAL DEFAULT 0,
    lead_id TEXT NOT NULL,
    stage_id TEXT NOT NULL,
    owner_id TEXT,
    probability INTEGER DEFAULT 0,
    expected_close_date DATETIME,
    custom_fields TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (stage_id) REFERENCES stages(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  -- Tabela de Configurações do Sistema (Multi-Tenant)
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de Agendamentos (Agenda/Calendário)
  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    user_id TEXT, -- Profissional que vai atender
    title TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status TEXT DEFAULT 'Agendado', -- Agendado, Confirmado, Concluído, Cancelado, Falta
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES leads(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Tabela de Planos de Assinatura
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    billing_interval TEXT DEFAULT 'monthly', -- monthly, yearly
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de Assinaturas Ativas
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, past_due, canceled, unpaid
    next_billing_date DATETIME NOT NULL,
    last_billing_date DATETIME,
    auto_renew INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES leads(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  );

  -- Horários de Funcionamento
  CREATE TABLE IF NOT EXISTS business_hours (
    day_of_week INTEGER PRIMARY KEY, -- 0 (Sunday) to 6 (Saturday)
    open_time TEXT,
    close_time TEXT,
    is_closed INTEGER DEFAULT 0
  );
`);

// Seed inicial se o banco estiver vazio
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  console.log("Seeding initial admin user...");
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)").run(
    'admin-1',
    'Administrador',
    'admin@nexus.com',
    hashedPassword,
    'admin'
  );
}

// Seed de configurações padrão
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
if (settingsCount.count === 0) {
  console.log("Seeding default settings...");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('workspace_type', 'general');
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('business_name', 'Nexus CRM');
}

// Seed de horários de funcionamento padrão (08:00 - 18:00)
const hoursCount = db.prepare("SELECT COUNT(*) as count FROM business_hours").get() as { count: number };
if (hoursCount.count === 0) {
  console.log("Seeding default business hours...");
  const insertHours = db.prepare("INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?)");
  for (let i = 0; i < 7; i++) {
    const isWeekend = i === 0 || i === 6;
    insertHours.run(i, '08:00', '18:00', isWeekend ? 1 : 0);
  }
}

// Seed de planos padrão
const plansCount = db.prepare("SELECT COUNT(*) as count FROM plans").get() as { count: number };
if (plansCount.count === 0) {
  console.log("Seeding default plans...");
  const insertPlan = db.prepare("INSERT INTO plans (id, name, description, price, billing_interval) VALUES (?, ?, ?, ?, ?)");
  insertPlan.run('p1', 'Corte Simples', 'Acesso a 1 corte por mês.', 50.00, 'monthly');
  insertPlan.run('p2', 'Clube da Barba', 'Cortes e barba ilimitados.', 120.00, 'monthly');
  insertPlan.run('p3', 'Plano Executivo', 'Corte, barba e sobrancelha ilimitados + 1 bebida.', 180.00, 'monthly');
  insertPlan.run('p4', 'Anual VIP', 'Todos os serviços ilimitados por um ano.', 1500.00, 'yearly');
}

const leadCount = db.prepare("SELECT COUNT(*) as count FROM leads").get() as { count: number };

if (leadCount.count === 0) {
  console.log("Seeding initial data...");
  const insertLead = db.prepare(`
    INSERT INTO leads (id, name, email, phone, source, status, custom_fields)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertLead.run('1', 'Ana Silva', 'ana@example.com', '(11) 99999-1111', 'WhatsApp', 'Novo Lead', JSON.stringify({ interesse: 'Plano Anual' }));
  insertLead.run('2', 'Carlos Santos', 'carlos@example.com', '(11) 98888-2222', 'Instagram', 'Em Contato', JSON.stringify({ cargo: 'CEO' }));
  insertLead.run('3', 'Marina Costa', 'marina@example.com', '(11) 97777-3333', 'Site', 'Qualificado', JSON.stringify({ empresa: 'Tech Corp' }));
}

const pipelineCount = db.prepare("SELECT COUNT(*) as count FROM pipelines").get() as { count: number };
if (pipelineCount.count === 0) {
  console.log("Seeding initial pipeline and stages...");
  db.prepare("INSERT INTO pipelines (id, name, is_default) VALUES (?, ?, ?)").run('p1', 'Vendas B2B', 1);
  
  const insertStage = db.prepare("INSERT INTO stages (id, pipeline_id, name, sort_order) VALUES (?, ?, ?, ?)");
  insertStage.run('s1', 'p1', 'Novo Lead', 1);
  insertStage.run('s2', 'p1', 'Em Contato', 2);
  insertStage.run('s3', 'p1', 'Qualificado', 3);
  insertStage.run('s4', 'p1', 'Proposta', 4);
  insertStage.run('s5', 'p1', 'Negociação', 5);
  insertStage.run('s6', 'p1', 'Fechado', 6);
}

export default db;
