import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('./.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const { data, error } = await supabase
    .from('sale_records')
    .select('*, customers(name)')
    .not('vehicle_id', 'is', null);

  if (error) { console.error(error.message); return; }

  console.log('Deals with allocated vehicles:', JSON.stringify(data, null, 2));

  console.log('Full deal details:', JSON.stringify(data, null, 2));

  // Also show deal_steps to see what steps were logged
  const { data: steps } = await supabase
    .from('deal_steps')
    .select('from_state, to_state, notes, created_at')
    .eq('entity_id', '158f18ed-6ea3-4648-bbef-abf310c2491a')
    .order('created_at', { ascending: true });

  console.log('\nDeal steps history:');
  steps?.forEach(s => console.log(`  ${s.from_state} -> ${s.to_state}  [${s.created_at}]  ${s.notes || ''}`));
}

run();
