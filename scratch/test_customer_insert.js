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
  const payload = {
    name: 'Test Om',
    phone: '9849209128',
    email: 'test_om@example.com',
    location: 'Kathmandu',
    branch_id: null,
    cars_owned: [],
    org_id: '30938fab-84fc-44d2-b522-c96d827c64b3'
  };

  const { data, error } = await supabase.from('customers').insert([payload]);
  if (error) {
    console.error('Error inserting customer:', error);
  } else {
    console.log('Success!', data);
  }
}

run();
