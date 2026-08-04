import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('./.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
   const query = "ALTER TABLE proforma_invoices ADD COLUMN IF NOT EXISTS units INTEGER DEFAULT 1;";
  console.log('Running query:', query);
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: query
  });

  if (error) {
    console.error('Error executing query via RPC:', error);
  } else {
    console.log('Result:', data);
  }
}

run();
