import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    console.log('--- STAGES COLUMNS ---');
    const stagesCol = await client.query('SELECT * FROM stages LIMIT 1');
    console.log(Object.keys(stagesCol.rows[0] || {}).join(', '));

    console.log('\n--- LEADS COLUMNS ---');
    const leadsCol = await client.query('SELECT * FROM leads LIMIT 1');
    console.log(Object.keys(leadsCol.rows[0] || {}).join(', '));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
