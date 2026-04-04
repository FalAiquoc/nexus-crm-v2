import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    console.log('--- PIPELINES DATA ---');
    const pipelines = await client.query('SELECT * FROM pipelines');
    console.log(JSON.stringify(pipelines.rows, null, 2));

    console.log('\n--- STAGES DATA ---');
    const stages = await client.query('SELECT * FROM stages');
    console.log(JSON.stringify(stages.rows, null, 2));

  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
  }
}

run();
