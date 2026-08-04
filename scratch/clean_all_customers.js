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
  const targetOrgId = '30938fab-84fc-44d2-b522-c96d827c64b3';

  console.log('Fetching all customers globally...');
  const { data: customers, error: fetchError } = await supabase
    .from('customers')
    .select('*');

  if (fetchError) {
    console.error('Error fetching customers:', fetchError);
    return;
  }

  for (const c of customers) {
    if (c.org_id !== targetOrgId) {
      console.log(`Updating customer ${c.name} (Phone: ${c.phone}) org_id to ${targetOrgId}...`);
      const { error: updateError } = await supabase
        .from('customers')
        .update({ org_id: targetOrgId })
        .eq('id', c.id);

      if (updateError) {
        console.error(`Error updating customer ${c.id}:`, updateError);
      } else {
        console.log(`Successfully updated customer ${c.name}`);
      }
    }
  }
}

run();
