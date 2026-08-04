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
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
  });
  if (error) {
    // If execute_sql RPC doesn't exist, try getting tables via postgres internal query or checking if we can query pg_catalog
    console.error('Error fetching via execute_sql RPC:', error);
  } else {
    console.log('Tables in database:', data);
  }
}

run();
