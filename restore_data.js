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

const APOLLO_MOTORS_ORG_ID = '30938fab-84fc-44d2-b522-c96d827c64b3';
const BACKUP_ORG_ID = 'deada55e-0000-0000-0000-000000000000';

const dataTables = [
  'leads',
  'customers',
  'parts',
  'campaigns',
  'appointments',
  'service_jobs',
  'invoices',
  'activities',
  'vehicles' // Restores vehicles back to Apollo Motors
];

async function run() {
  console.log('Restoring all data (including inventory) back to Apollo Motors...');

  for (const table of dataTables) {
    console.log(`Restoring data in table '${table}' back to Apollo Motors...`);
    const { data, error } = await supabase
      .from(table)
      .update({ org_id: APOLLO_MOTORS_ORG_ID })
      .eq('org_id', BACKUP_ORG_ID)
      .select();

    if (error) {
      console.error(`Error restoring data in table '${table}':`, error.message);
    } else {
      console.log(`Successfully restored ${data?.length || 0} records in '${table}'.`);
    }
  }

  console.log('Restore complete. Verify database state now.');
}

run();
