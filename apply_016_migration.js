import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:JZ08otMF8VHVXnhjiLbNYgAw15fJsVWXVFKAIr2xsSk@db.tjjxrfiorfboknnaxevz.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const res = await client.query(`ALTER TABLE proforma_invoices ADD COLUMN IF NOT EXISTS units INTEGER DEFAULT 1;`);
    console.log('Migration applied successfully!', res.command);
    
    // Verify
    const check = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'proforma_invoices' AND column_name = 'units';
    `);
    console.log('Column status:', check.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
