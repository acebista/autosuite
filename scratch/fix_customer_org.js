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
  const phone = '9849209128';
  const targetOrgId = '30938fab-84fc-44d2-b522-c96d827c64b3';

  console.log(`Searching for customer with phone ${phone}...`);
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (fetchError) {
    console.error('Error fetching customer:', fetchError);
    return;
  }

  console.log('Found customer:', customer);

  if (customer.org_id !== targetOrgId) {
    console.log(`Updating customer org_id to ${targetOrgId}...`);
    const { data: updated, error: updateError } = await supabase
      .from('customers')
      .update({ org_id: targetOrgId })
      .eq('id', customer.id)
      .select();

    if (updateError) {
      console.error('Error updating customer org_id:', updateError);
    } else {
      console.log('Customer org_id updated successfully!', updated);
    }
  } else {
    console.log('Customer already belongs to the target organization.');
  }
}

run();
