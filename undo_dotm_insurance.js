import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('./.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

const DEAL_ID = '158f18ed-6ea3-4648-bbef-abf310c2491a';

async function run() {
  // 1. Revert the sale_record:
  //    - Clear all insurance fields
  //    - Clear all DoTM / registration fields
  //    - Revert state to PAYMENT_STRUCTURED (before insurance activation)
  const { error: updateErr } = await supabase
    .from('sale_records')
    .update({
      current_state: 'PAYMENT_STRUCTURED',
      // Clear insurance
      insurance_activated_at: null,
      insurance_endorsed_at: null,
      insurance_policy_no: null,
      // Clear DoTM / registration
      dotm_rep: null,
      registration_no: null,
      registered_at: null,
      registered_under: null,
      // Clear disbursement (if any was set)
      disbursement_requested_at: null,
      disbursement_received_at: null,
      disbursement_amount: null,
    })
    .eq('id', DEAL_ID);

  if (updateErr) {
    console.error('Failed to revert sale record:', updateErr.message);
    return;
  }
  console.log('✓ Sale record reverted to PAYMENT_STRUCTURED state');
  console.log('  ✓ Insurance activation cleared');
  console.log('  ✓ Insurance endorsement cleared');
  console.log('  ✓ DoTM registration cleared');
  console.log('  ✓ Disbursement cleared');

  // 2. Delete the audit trail steps after PAYMENT_STRUCTURED
  //    (remove INSURANCE_ACTIVATION, BANK_ALLOTMENT, DOTM_REGISTRATION, INSURANCE_ENDORSEMENT, BANK_DISBURSEMENT)
  const statesToRemove = [
    'INSURANCE_ACTIVATION',
    'BANK_ALLOTMENT',
    'DOTM_REGISTRATION',
    'INSURANCE_ENDORSEMENT',
    'BANK_DISBURSEMENT'
  ];

  const { error: stepsErr, count } = await supabase
    .from('deal_steps')
    .delete({ count: 'exact' })
    .eq('entity_id', DEAL_ID)
    .in('to_state', statesToRemove);

  if (stepsErr) {
    console.error('Failed to delete deal steps:', stepsErr.message);
  } else {
    console.log(`✓ Removed ${count} audit log entries (INSURANCE_ACTIVATION through BANK_DISBURSEMENT)`);
  }

  // 3. Log a reversal audit entry
  const { error: auditErr } = await supabase
    .from('deal_steps')
    .insert([{
      entity_type: 'SALE',
      entity_id: DEAL_ID,
      from_state: 'BANK_DISBURSEMENT',
      to_state: 'PAYMENT_STRUCTURED',
      notes: 'REVERSAL: DoTM registration and insurance activation undone by admin. Reverted to Payment Structured state.',
      org_id: '30938fab-84fc-44d2-b522-c96d827c64b3'
    }]);

  if (auditErr) {
    console.error('Failed to log reversal:', auditErr.message);
  } else {
    console.log('✓ Reversal audit entry logged');
  }

  // 4. Verify final state
  const { data: final } = await supabase
    .from('sale_records')
    .select('current_state, insurance_activated_at, registration_no, dotm_rep')
    .eq('id', DEAL_ID)
    .single();

  console.log('\nFinal state:');
  console.log('  current_state:', final?.current_state);
  console.log('  insurance_activated_at:', final?.insurance_activated_at);
  console.log('  registration_no:', final?.registration_no);
  console.log('  dotm_rep:', final?.dotm_rep);
}

run();
