
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function seed() {
  console.log('🌱 Iniciando seed de leads realistas para o DoBoy...');
  
  const sources = ['Google Ads', 'Instagram', 'Indicação', 'WhatsApp', 'Orgânico'];
  const stages = ['Novo Lead', 'Qualificado', 'Proposta', 'Negociação', 'Fechado', 'Perdido'];
  const names = [
    'Arthur Silva', 'Beatriz Santos', 'Carlos Oliveira', 'Daniela Lima', 'Eduardo Costa',
    'Fernanda Souza', 'Gabriel Pereira', 'Helena Rodrigues', 'Igor Almeida', 'Juliana Ferreira',
    'Kleber Machado', 'Larissa Gomes', 'Murilo Rocha', 'Natália Silva', 'Otávio Mendes',
    'Patrícia Lima', 'Quintino Reis', 'Ricardo Souza', 'Sabrina Costa', 'Tiago Oliveira'
  ];

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  console.log(`🚀 Criando 50 leads de Janeiro de ${now.getFullYear()} até hoje no Supabase...`);

  for (let i = 0; i < 50; i++) {
    const randomDate = new Date(startOfYear.getTime() + Math.random() * (now.getTime() - startOfYear.getTime()));
    const name = names[Math.floor(Math.random() * names.length)] + ' ' + (i + 1);
    const source = sources[Math.floor(Math.random() * sources.length)];
    const status = stages[Math.floor(Math.random() * stages.length)];
    const value = Math.floor(Math.random() * 15000) + 1500;
    const email = `lead${i}@exemplo.com.br`;
    const phone = `(11) 9${Math.floor(Math.random() * 89999999 + 10000000)}`;

    await pool.query(
      `INSERT INTO clients (name, email, phone, status, source, value, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [name, email, phone, status, source, value, randomDate.toISOString(), randomDate.toISOString()]
    );
  }

  console.log('✅ 50 leads criados com sucesso no banco de dados!');
  await pool.end();
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
