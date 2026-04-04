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
    
    console.log('--- TABLES ---');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(tables.rows.map(r => r.table_name).join(', '));

    for (const table of tables.rows) {
      console.log(`\n--- COLUMNS FOR ${table.table_name} ---`);
      const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table.table_name}'
      `);
      console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
      
      const count = await client.query(`SELECT COUNT(*) FROM "${table.table_name}"`);
      console.log(`Total Rows: ${count.rows[0].count}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
