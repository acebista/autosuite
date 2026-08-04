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
  const { data: vehicles, error } = await supabase.from('vehicles').select('*');
  if (error) {
    console.error(error);
  } else {
    console.log(`Total vehicles in DB: ${vehicles.length}`);
    vehicles.forEach((v, index) => {
      console.log(`\n--- Vehicle ${index + 1} ---`);
      console.log(`ID: ${v.id}`);
      console.log(`Model: ${v.model}`);
      console.log(`Variant: ${v.variant}`);
      console.log(`VIN: ${v.vin}`);
      console.log(`Image URL: ${v.image_url}`);
      console.log(`Status: ${v.status}`);
      console.log(`All Keys: ${Object.keys(v).join(', ')}`);
    });
  }
}

run();
