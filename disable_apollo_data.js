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
  'activities'
];

async function run() {
  console.log('Starting full data disablement for Apollo Motors...');

  // 0. Ensure backup organization exists
  const { data: existingOrg, error: orgFetchError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', BACKUP_ORG_ID)
    .maybeSingle();

  if (orgFetchError) {
    console.error('Error checking backup org:', orgFetchError);
    return;
  }

  if (!existingOrg) {
    console.log('Creating backup organization...');
    const { error: orgInsertError } = await supabase
      .from('organizations')
      .insert({
        id: BACKUP_ORG_ID,
        name: 'Backup Archive',
        slug: 'backup-archive'
      });
    
    if (orgInsertError) {
      console.error('Error inserting backup organization:', orgInsertError);
      return;
    }
  }

  // 1. Move all transactional data to backup org
  for (const table of dataTables) {
    console.log(`Moving data in table '${table}' to backup organization...`);
    const { data, error } = await supabase
      .from(table)
      .update({ org_id: BACKUP_ORG_ID })
      .eq('org_id', APOLLO_MOTORS_ORG_ID)
      .select();

    if (error) {
      console.error(`Error moving data in table '${table}':`, error.message);
    } else {
      console.log(`Successfully moved ${data?.length || 0} records from '${table}'.`);
    }
  }

  // 2. Clear any activities without org_id that are related to the leads/customers
  // Let's get the list of leads/customers currently in the backup org to clean their associated null-org activities
  const { data: leads } = await supabase.from('leads').select('id').eq('org_id', BACKUP_ORG_ID);
  const { data: customers } = await supabase.from('customers').select('id').eq('org_id', BACKUP_ORG_ID);
  const ids = [
    ...(leads || []).map(l => l.id),
    ...(customers || []).map(c => c.id)
  ];

  if (ids.length > 0) {
    console.log('Updating associated null-org activities...');
    const { data: updatedActivities, error: activitiesError } = await supabase
      .from('activities')
      .update({ org_id: BACKUP_ORG_ID })
      .in('entity_id', ids)
      .select();
    
    if (activitiesError) {
      console.error('Error updating associated activities:', activitiesError.message);
    } else {
      console.log(`Successfully updated ${updatedActivities?.length || 0} null-org activities.`);
    }
  }

  // 3. Reset all vehicles in stock and clear registration number
  console.log('Resetting all vehicle statuses to In Stock and clearing registration numbers...');
  const { data: updatedVehicles, error: vehicleError } = await supabase
    .from('vehicles')
    .update({ status: 'In Stock', registration_no: null })
    .eq('org_id', APOLLO_MOTORS_ORG_ID)
    .select();

  if (vehicleError) {
    console.error('Error resetting vehicles:', vehicleError.message);
  } else {
    console.log(`Successfully reset ${updatedVehicles?.length || 0} vehicles.`);
  }

  console.log('Verification check of remaining active data for Apollo Motors:');
  for (const table of dataTables) {
    const { data } = await supabase.from(table).select('id').eq('org_id', APOLLO_MOTORS_ORG_ID);
    console.log(`- '${table}': ${data?.length || 0} active records.`);
  }
}

run();
