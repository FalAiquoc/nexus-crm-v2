import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CRM_URL = 'http://localhost:3001/api/webhook/whatsapp'; 
const BLACKLISTED_PHONE = '5584999887766';
const NEW_CLIENT_PHONE = '5584911223344';

async function runTests() {
  console.log('🚀 Iniciando Testes de Webhook (Native Fetch)...');

  try {
    console.log('🧹 Limpando dados de teste anteriores...');
    await pool.query('DELETE FROM whatsapp_blacklist WHERE phone_number = $1', [BLACKLISTED_PHONE]);
    await pool.query('DELETE FROM leads WHERE phone = $1', [NEW_CLIENT_PHONE]);

    // TESTE 1: Bloqueio de Blacklist
    console.log('\n🛡️ TESTE 1: Inserindo número na Blacklist e enviando mensagem...');
    await pool.query('INSERT INTO whatsapp_blacklist (phone_number, description) VALUES ($1, $2)', [BLACKLISTED_PHONE, 'Bloqueio de Teste']);
    
    // Simula o servidor local estar rodando
    const sendWebhook = async (phone: string, text: string) => {
        try {
            const response = await fetch(CRM_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'MESSAGES_UPSERT',
                    data: {
                        key: { remoteJid: `${phone}@s.whatsapp.net`, instanceName: 'test_instance' },
                        message: { conversation: text }
                    }
                })
            });
            return await response.json();
        } catch (e: any) {
            return { error: e.message };
        }
    };

    const resBlacklist = await sendWebhook(BLACKLISTED_PHONE, 'Olá!');
    console.log('Resposta do Webhook (Blacklist):', resBlacklist);
    
    if (resBlacklist && (resBlacklist as any).status === 'ignored_by_blacklist') {
        console.log('✅ SUCESSO: O sistema ignorou o contato bloqueado corretamente.');
    } else {
        console.log('❌ FALHA: O sistema não ignorou o contato bloqueado.');
    }

    // TESTE 2: Auto-Tagging
    console.log('\n🏷️ TESTE 2: Enviando mensagem de novo cliente...');
    const resNew = await sendWebhook(NEW_CLIENT_PHONE, 'Quero ser cliente!');
    console.log('Resposta do Webhook (Novo Cliente):', resNew);

    const result = await pool.query('SELECT custom_fields FROM leads WHERE phone = $1', [NEW_CLIENT_PHONE]);
    if (result.rows.length > 0) {
        const tags = result.rows[0].custom_fields?.tags || [];
        if (tags.includes('#cliente')) {
            console.log('✅ SUCESSO: Novo lead tagueado como #cliente.');
        } else {
            console.log('❌ FALHA: Tag #cliente não encontrada. Tags:', tags);
        }
    } else {
        console.log('❌ FALHA: Lead não criado. Verifique se o servidor local está rodando e conectado ao DB.');
    }

  } catch (err: any) {
    console.error('🔥 Erro:', err.message);
  } finally {
    await pool.end();
  }
}

runTests();
