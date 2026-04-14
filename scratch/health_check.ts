import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function report() {
    console.log('📊 RELATÓRIO DE INTEGRIDADE - NEXUS CRM');
    try {
        const bl = await pool.query('SELECT count(*) as total FROM whatsapp_blacklist');
        console.log(`✅ Blacklist: ${bl.rows[0].total} contatos bloqueados.`);

        const tags = await pool.query("SELECT count(*) as total FROM leads WHERE (custom_fields->'tags')::jsonb ? '#cliente'");
        console.log(`✅ Auto-Tagging: ${tags.rows[0].total} leads com a tag #cliente.`);

        const sample = await pool.query("SELECT name, phone, custom_fields->'tags' as tags FROM leads WHERE (custom_fields->'tags')::jsonb ? '#cliente' LIMIT 3");
        console.log('📝 Amostra de Clientes:', JSON.stringify(sample.rows, null, 2));

    } catch (e: any) {
        console.error('❌ ERRO NO BANCO:', e.message);
    } finally {
        await pool.end();
    }
}

report();
