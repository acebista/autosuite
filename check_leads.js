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
  const { data: leads, error } = await supabase.from('leads').select('id, name, phone, status, org_id');
  if (error) {
    console.error(error);
  } else {
    console.log(`Total leads: ${leads.length}`);
    leads.forEach(l => {
      console.log(`- ID: ${l.id}, Name: ${l.name}, Phone: ${l.phone}, Status: ${l.status}, Org ID: ${l.org_id}`);
    });
  }
}

run();
