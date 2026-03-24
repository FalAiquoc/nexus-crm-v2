import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔗 Conectando ao PostgreSQL (Supabase/Dokploy)');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ AVISO: DATABASE_URL não definida! O backend precisará dessa variável para se conectar ao banco.');
}

const dbConfig: any = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
};

// Deixamos o controle de SSL por conta da string DATABASE_URL (importante para Supabase Self-Hosted)
const pool = new Pool(dbConfig);

// Helper objects to maintain compatibility with the previous codebase that used sync SQLite APIs wrapped in async
const db: any = {};
db.query = async (sql: string, params: any[]) => pool.query(sql, params);

db.prepare = (sql: string) => ({
  get: async (...params: any[]) => {
    const pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
    const res = await pool.query(pgSql, params);
    return res.rows[0];
  },
  all: async (...params: any[]) => {
    const pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
    const res = await pool.query(pgSql, params);
    return res.rows;
  },
  run: async (...params: any[]) => {
    const pgSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
    return await pool.query(pgSql, params);
  }
});

db.exec = async (sql: string) => {
  return await pool.query(sql);
};

// Initialization Logic (Postgres)
async function initDb() {
  try {
    // Schema Init (Executado via async wrapper para o Postgres)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'vendedor',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cnpj TEXT UNIQUE,
        segment TEXT,
        size TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        source TEXT,
        score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Novo Lead',
        company_id TEXT,
        custom_fields TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      );

      CREATE TABLE IF NOT EXISTS pipelines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stages (
        id TEXT PRIMARY KEY,
        pipeline_id TEXT NOT NULL,
        name TEXT,
        sort_order INTEGER,
        FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)
      );

      CREATE TABLE IF NOT EXISTS deals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        value REAL DEFAULT 0,
        lead_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        owner_id TEXT,
        probability INTEGER DEFAULT 0,
        expected_close_date TIMESTAMP,
        custom_fields TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (stage_id) REFERENCES stages(id),
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES leads(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        price DECIMAL(10,2),
        billing_interval TEXT DEFAULT 'monthly',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        next_billing_date TIMESTAMP NOT NULL,
        last_billing_date TIMESTAMP,
        auto_renew INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES leads(id),
        FOREIGN KEY (plan_id) REFERENCES plans(id)
      );

      CREATE TABLE IF NOT EXISTS business_hours (
        day_of_week INTEGER PRIMARY KEY,
        open_time TEXT,
        close_time TEXT,
        is_closed INTEGER DEFAULT 0
      );
    `);

    // Seeds for SQLite
    const userCount = await db.prepare("SELECT COUNT(*) as count FROM users").get();
    if (userCount.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)").run(
        'admin-1', 'Administrador', 'admin@nexus.com', hashedPassword, 'admin'
      );
    }
    
    const settingsCount = await db.prepare("SELECT COUNT(*) as count FROM settings").get();
    if (settingsCount.count === 0) {
      await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('workspace_type', 'general');
      await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('business_name', 'Nexus CRM');
    }

    const hoursCount = await db.prepare("SELECT COUNT(*) as count FROM business_hours").get();
    if (hoursCount.count === 0) {
      const insertHours = db.prepare("INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?)");
      for (let i = 0; i < 7; i++) {
        const isWeekend = i === 0 || i === 6;
        await insertHours.run(i, '08:00', '18:00', isWeekend ? 1 : 0);
      }
    }

    const plansCount = await db.prepare("SELECT COUNT(*) as count FROM plans").get();
    if (plansCount.count === 0) {
      const insertPlan = db.prepare("INSERT INTO plans (id, name, description, price, billing_interval) VALUES (?, ?, ?, ?, ?)");
      await insertPlan.run('p1', 'Corte Simples', 'Acesso a 1 corte por mês.', 50.00, 'monthly');
      await insertPlan.run('p2', 'Clube da Barba', 'Cortes e barba ilimitados.', 120.00, 'monthly');
      await insertPlan.run('p3', 'Plano Executivo', 'Corte, barba e sobrancelha ilimitados + 1 bebida.', 180.00, 'monthly');
      await insertPlan.run('p4', 'Anual VIP', 'Todos os serviços ilimitados por um ano.', 1500.00, 'yearly');
    }

    const leadCount = await db.prepare("SELECT COUNT(*) as count FROM leads").get();
    if (leadCount.count === 0) {
      const insertLead = db.prepare(`
        INSERT INTO leads (id, name, email, phone, source, status, custom_fields)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      await insertLead.run('1', 'Ana Silva', 'ana@example.com', '(11) 99999-1111', 'WhatsApp', 'Novo Lead', JSON.stringify({ interesse: 'Plano Anual' }));
      await insertLead.run('2', 'Carlos Santos', 'carlos@example.com', '(11) 98888-2222', 'Instagram', 'Em Contato', JSON.stringify({ cargo: 'CEO' }));
      await insertLead.run('3', 'Marina Costa', 'marina@example.com', '(11) 97777-3333', 'Site', 'Qualificado', JSON.stringify({ empresa: 'Tech Corp' }));
    }

    const pipelineCount = await db.prepare("SELECT COUNT(*) as count FROM pipelines").get();
    if (pipelineCount.count === 0) {
      await db.prepare("INSERT INTO pipelines (id, name, is_default) VALUES (?, ?, ?)").run('p1', 'Vendas B2B', 1);
      const insertStage = db.prepare("INSERT INTO stages (id, pipeline_id, name, sort_order) VALUES (?, ?, ?, ?)");
      await insertStage.run('s1', 'p1', 'Novo Lead', 1);
      await insertStage.run('s2', 'p1', 'Em Contato', 2);
      await insertStage.run('s3', 'p1', 'Qualificado', 3);
      await insertStage.run('s4', 'p1', 'Proposta', 4);
      await insertStage.run('s5', 'p1', 'Negociação', 5);
      await insertStage.run('s6', 'p1', 'Fechado', 6);
    }
  } catch (err) {
    console.error('Erro ao inicializar o banco:', err);
  }
}

// Export a function to ensure DB is initialized
export const initializeDatabase = initDb;
export default db;
