import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('./.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function fixExistingDeals() {
  // Find all BOOKED sale records that actually have a vehicle_id assigned
  const { data: deals, error } = await supabase
    .from('sale_records')
    .select('id, customer_id, vehicle_id, current_state, customers(name)')
    .eq('current_state', 'BOOKED')
    .not('vehicle_id', 'is', null);

  if (error) {
    console.error('Error fetching deals:', error.message);
    return;
  }

  console.log(`Found ${deals?.length || 0} BOOKED deals with vehicles assigned:`);
  deals?.forEach(d => console.log(` - ${d.customers?.name}: deal ${d.id}, vehicle ${d.vehicle_id}`));

  if (!deals?.length) {
    console.log('No deals to fix.');
    return;
  }

  // Update them to ALLOCATED state
  const ids = deals.map(d => d.id);
  const { error: updateError } = await supabase
    .from('sale_records')
    .update({ current_state: 'ALLOCATED' })
    .in('id', ids);

  if (updateError) {
    console.error('Error updating deals:', updateError.message);
  } else {
    console.log(`✓ Updated ${ids.length} deal(s) to ALLOCATED state`);
  }
}

fixExistingDeals();
