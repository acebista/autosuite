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
  const vehicleId = 'bf12a8da-6fef-4d29-97c5-69d01d61a59c';
  console.log(`Updating vehicle ${vehicleId} to 'In Stock'...`);
  const { data, error } = await supabase
    .from('vehicles')
    .update({ 
      status: 'In Stock',
      vehicle_state: 'IN_STOCK'
    })
    .eq('id', vehicleId)
    .select();

  if (error) {
    console.error('Error updating vehicle:', error);
  } else {
    console.log('Success updating vehicle status to In Stock!', data);
  }
}

run();
