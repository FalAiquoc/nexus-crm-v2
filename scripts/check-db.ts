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
    console.log('--- STAGES ---');
    const stagesRes = await client.query('SELECT name FROM stages ORDER BY position ASC');
    console.log(JSON.stringify(stagesRes.rows, null, 2));

    console.log('\n--- LEADS STATUS SUMMARY ---');
    const leadsRes = await client.query('SELECT status, COUNT(*) FROM leads GROUP BY status');
    console.log(JSON.stringify(leadsRes.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
