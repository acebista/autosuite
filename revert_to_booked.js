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

const supabase = createClient(env['VITE_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

const DEAL_ID = '158f18ed-6ea3-4648-bbef-abf310c2491a';
const VEHICLE_ID = 'bf12a8da-6fef-4d29-97c5-69d01d61a59c';
const ORG_ID = '30938fab-84fc-44d2-b522-c96d827c64b3';

async function run() {
  console.log('Starting revert for Om Bahadur Khadka (Deal ID:', DEAL_ID, ')...');

  // 1. Revert sale record back to BOOKED and clear all subsequent fields
  const { error: saleErr } = await supabase
    .from('sale_records')
    .update({
      current_state: 'BOOKED',
      vehicle_id: null,
      payment_type: null,
      bank_name: null,
      bank_branch: null,
      rm_name: null,
      rm_phone: null,
      approved_loan: null,
      allocation_date: null,
      insurance_activated_at: null,
      insurance_endorsed_at: null,
      insurance_policy_no: null,
      dotm_rep: null,
      registration_no: null,
      registered_at: null,
      registered_under: null,
      disbursement_requested_at: null,
      disbursement_received_at: null,
      disbursement_amount: null,
      ready_for_delivery_at: null,
      delivered_at: null,
    })
    .eq('id', DEAL_ID);

  if (saleErr) {
    console.error('sale_records update failed:', saleErr.message);
    return;
  }
  console.log('✓ Deal reverted to BOOKED, vehicle unlinked, and all payment/F&I fields cleared.');

  // 2. Return vehicle to IN_STOCK, clear status to 'In Stock', and clear registration_no
  const { error: vehicleErr } = await supabase
    .from('vehicles')
    .update({
      vehicle_state: 'IN_STOCK',
      status: 'In Stock',
      registration_no: null
    })
    .eq('id', VEHICLE_ID);

  if (vehicleErr) {
    console.error('vehicles update failed:', vehicleErr.message);
    return;
  }
  console.log('✓ Vehicle returned to IN_STOCK / In Stock, and registration_no cleared.');

  // 3. Delete all deal_steps except the first BOOKED entry
  const { data: steps, error: fetchStepsErr } = await supabase
    .from('deal_steps')
    .select('id, to_state, created_at')
    .eq('entity_id', DEAL_ID)
    .order('created_at', { ascending: true });
  
  if (fetchStepsErr) {
    console.error('Failed to fetch deal steps:', fetchStepsErr.message);
    return;
  }

  const toDelete = steps?.slice(1).map(s => s.id) || [];
  if (toDelete.length) {
    const { error: deleteErr } = await supabase
      .from('deal_steps')
      .delete()
      .in('id', toDelete);
    if (deleteErr) {
      console.error('Steps delete failed:', deleteErr.message);
    } else {
      console.log(`✓ Removed ${toDelete.length} subsequent deal_steps, keeping only the initial BOOKED entry.`);
    }
  }

  // 4. Log the new reversal audit step
  const { error: insertStepErr } = await supabase
    .from('deal_steps')
    .insert([{
      entity_type: 'SALE',
      entity_id: DEAL_ID,
      from_state: 'PAYMENT_STRUCTURED',
      to_state: 'BOOKED',
      notes: 'REVERSAL: Full reset to Booked Awaiting Vehicle state by admin.',
      org_id: ORG_ID
    }]);

  if (insertStepErr) {
    console.error('Failed to log reversal step:', insertStepErr.message);
  } else {
    console.log('✓ Reversal audit step logged.');
  }

  console.log('Revert process finished successfully.');
}

run();
