import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.tjjxrfiorfboknnaxevz:Sachu123!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    console.log('Connecting to database via aws-1 pooler and test password...');
    await client.connect();
    console.log('Connected. Running ALTER TABLE queries...');
    
    // Drop constraint
    console.log('Dropping unique constraint customers_phone_key if exists...');
    await client.query('ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;');
    console.log('Dropped successfully.');

    // Add scoped unique constraint
    console.log('Adding unique constraint customers_phone_org_id_key on (phone, org_id)...');
    await client.query('ALTER TABLE customers ADD CONSTRAINT customers_phone_org_id_key UNIQUE (phone, org_id);');
    console.log('Constraint added successfully!');

  } catch (err) {
    console.error('Database migration failed:', err);
  } finally {
    await client.end();
    console.log('Disconnected.');
  }
}

run();
