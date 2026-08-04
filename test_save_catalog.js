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
    model: 'Test Deepal Model',
    variant: 'Test Variant',
    year: 2026,
    color: '', // Let's try empty string
    vin: `CAT-TEST-${Date.now()}`,
    price: 5000000,
    cost: 0,
    status: 'In Stock',
    fuel_type: 'EV',
    image_url: '',
    specifications: [],
    available_colors: [],
    org_id: '30938fab-84fc-44d2-b522-c96d827c64b3'
  };

  const { data, error } = await supabase.from('vehicles').insert([payload]);
  if (error) {
    console.error('Error inserting vehicle:', error);
  } else {
    console.log('Success!', data);
  }
}

run();
