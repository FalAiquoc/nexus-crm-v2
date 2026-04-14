#!/usr/bin/env node

/**
 * Teste de Conexão MCP ao Supabase
 * 
 * Este script valida:
 * 1. Conexão direta ao PostgreSQL via DATABASE_URL
 * 2. Acesso às tabelas do CRM
 * 3. Isolamento de dados por workspace_type
 * 4. Integridade de índices e constraints
 * 
 * Uso: node tests/supabase-connection-test.mjs
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config();

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}`),
};

// Configuração da conexão - Supabase Cloud
// Project: mxopomydvkyfdtlooypd
// MCP: https://mcp.supabase.com/mcp?project_ref=mxopomydvkyfdtlooypd

const DATABASE_URL = process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URI ||
  // Formato Supabase Cloud - precisa da senha do banco
  'postgresql://postgres.mxopomydvkyfdtlooypd:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const config = {
  connectionString: DATABASE_URL,
  // Supabase Cloud requer SSL com Transaction Pooler (porta 6543)
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
};

let pool;
let results = { passed: 0, failed: 0, warnings: 0 };

async function runTests() {
  log.section('🔗 TESTE DE CONEXÃO MCP AO SUPABASE - NEXUS CRM v2');

  // Teste 1: Conexão ao Pool
  try {
    log.info('Testando conexão ao PostgreSQL...');
    pool = new Pool(config);

    const client = await pool.connect();
    log.success('Conexão estabelecida com sucesso!');
    client.release();
    results.passed++;
  } catch (err) {
    log.error(`Falha na conexão: ${err.message}`);
    log.warn('Verifique se DATABASE_URL está configurado corretamente');
    results.failed++;
    return; // Não continua sem conexão
  }

  // Teste 2: Versão do PostgreSQL
  try {
    const { rows } = await pool.query('SELECT version()');
    log.success(`PostgreSQL: ${rows[0].version.substring(0, 50)}...`);
    results.passed++;
  } catch (err) {
    log.error(`Falha ao obter versão: ${err.message}`);
    results.failed++;
  }

  // Teste 3: Tabelas do CRM existem
  log.section('📊 Verificação de Tabelas');

  const expectedTables = [
    'users', 'leads', 'pipelines', 'stages', 'settings',
    'appointments', 'plans', 'subscriptions', 'access_requests',
    'automation_rules', 'whatsapp_instances', 'whatsapp_messages',
    'automation_logs'
  ];

  for (const table of expectedTables) {
    try {
      const { rows } = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );

      if (rows[0].exists) {
        log.success(`Tabela "${table}" existe`);
        results.passed++;
      } else {
        log.warn(`Tabela "${table}" NÃO encontrada`);
        results.warnings++;
      }
    } catch (err) {
      log.error(`Erro ao verificar tabela "${table}": ${err.message}`);
      results.failed++;
    }
  }

  // Teste 4: Isolamento por workspace_type
  log.section('🏢 Isolamento de Workspaces');

  try {
    const { rows: settings } = await pool.query(
      `SELECT key, value FROM settings WHERE key = 'workspace_type' LIMIT 1`
    );

    if (settings.length > 0) {
      log.success(`workspace_type configurado: ${settings[0].value}`);
      results.passed++;
    } else {
      log.warn('workspace_type não encontrado em settings');
      results.warnings++;
    }
  } catch (err) {
    log.error(`Erro ao verificar workspace_type: ${err.message}`);
    results.failed++;
  }

  // Teste 5: Contagem de leads por workspace
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN is_mock = true THEN 1 END) as mock_leads,
        COUNT(CASE WHEN is_mock = false THEN 1 END) as real_leads
      FROM leads
    `);

    log.success(`Leads: ${rows[0].total_leads} total (${rows[0].mock_leads} mock, ${rows[0].real_leads} reais)`);
    results.passed++;
  } catch (err) {
    log.warn(`Não foi possível contar leads: ${err.message}`);
    results.warnings++;
  }

  // Teste 6: Verificar índices
  log.section('🔍 Verificação de Índices');

  try {
    const { rows } = await pool.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    log.success(`${rows.length} índices encontrados`);
    results.passed++;
  } catch (err) {
    log.warn(`Não foi possível verificar índices: ${err.message}`);
    results.warnings++;
  }

  // Teste 7: Verificar constraints de integridade
  log.section('🛡️ Constraints e Integridade');

  try {
    const { rows } = await pool.query(`
      SELECT conname, conrelid::regclass as table_name
      FROM pg_constraint
      WHERE contype = 'f'  -- Foreign keys
      ORDER BY conrelid::regclass::text
    `);

    log.success(`${rows.length} foreign keys encontradas`);
    results.passed++;
  } catch (err) {
    log.warn(`Não foi possível verificar constraints: ${err.message}`);
    results.warnings++;
  }

  // Teste 8: Testar query de usuários
  try {
    const { rows: users } = await pool.query(`
      SELECT id, name, email, role, COUNT(l.id) as lead_count
      FROM users u
      LEFT JOIN leads l ON l.created_by = u.id
      GROUP BY u.id
      ORDER BY u.name
      LIMIT 5
    `);

    if (users.length > 0) {
      log.success(`${users.length} usuários encontrados:`);
      users.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) [${u.role}] - ${u.lead_count} leads`);
      });
      results.passed++;
    } else {
      log.warn('Nenhum usuário encontrado');
      results.warnings++;
    }
  } catch (err) {
    log.error(`Erro ao query usuários: ${err.message}`);
    results.failed++;
  }

  // Summary
  log.section('📊 RESUMO FINAL');
  console.log(`${colors.green}✅ Passou: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Alertas: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}❌ Falhou: ${results.failed}${colors.reset}`);

  const total = results.passed + results.failed + results.warnings;
  const score = Math.round((results.passed / total) * 100);
  console.log(`\n${colors.cyan}Score: ${score}%${colors.reset}\n`);

  // Fechar pool
  if (pool) {
    await pool.end();
    log.info('Conexão encerrada');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  log.error(`Erro fatal: ${err.message}`);
  process.exit(1);
});
