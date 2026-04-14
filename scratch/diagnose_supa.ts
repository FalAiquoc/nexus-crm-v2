import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Iniciando Diagnóstico Robusto...');

// Configuração manual para teste de múltiplas senhas
const configs = [
  { user: 'postgres.mxopomydvkyfdtlooypd', password: 'Seguro2026Sup@base!' },
  { user: 'postgres.mxopomydvkyfdtlooypd', password: 'Supa01Seguro' },
  { user: 'postgres', password: 'Seguro2026Sup@base!' },
  { user: 'postgres', password: 'Supa01Seguro' }
];

async function testConfig(config: any) {
  console.log(`\n🧪 Testando: User=${config.user} | Password=${config.password}`);
  const pool = new Pool({
    user: config.user,
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    database: 'postgres',
    password: config.password,
    port: 6543,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const client = await pool.connect();
    console.log('✅ SUCESSO! Conexão estabelecida.');
    const res = await client.query('SELECT current_user, current_database()');
    console.log('Dados:', res.rows[0]);
    client.release();
    return true;
  } catch (err: any) {
    console.log('❌ FALHA:', err.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function runAll() {
  for (const c of configs) {
    if (await testConfig(c)) {
        console.log('\n🌟 ENCONTRAMOS A CONFIGURAÇÃO CORRETA! 🌟');
        break;
    }
  }
}

runAll();
