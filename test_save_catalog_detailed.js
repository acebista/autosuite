import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local
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
  const payload = {
    model: 'Test Deepal Model 2',
    variant: 'Test Variant 2',
    year: 2026,
    color: '',
    vin: `CAT-TEST-2-${Date.now()}`,
    price: 5000000,
    cost: 0,
    status: 'In Stock',
    fuel_type: 'EV',
    image_url: '',
    specifications: [],
    available_colors: [],
    org_id: '30938fab-84fc-44d2-b522-c96d827c64b3'
  };

  console.log('Inserting with .select().single()...');
  const { data, error } = await supabase
    .from('vehicles')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error inserting vehicle with select.single:', error);
  } else {
    console.log('Success!', data);
  }

  // Print RLS policies on vehicles
  console.log('\n--- PG POLICIES on vehicles ---');
  const { data: policies, error: pError } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'vehicles';"
  });
  if (pError) {
    console.log('Could not fetch policies via RPC, trying a direct SELECT query if execute_sql is not defined...');
    // Fallback: try raw query
    const { data: rawData, error: rawError } = await supabase.from('pg_policies').select('*').eq('tablename', 'vehicles');
    if (rawError) console.error('Raw policy query failed:', rawError);
    else console.log(rawData);
  } else {
    console.log(policies);
  }
}

run();
