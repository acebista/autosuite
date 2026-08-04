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
  console.log('\n--- ORGANIZATIONS ---');
  const { data: orgs, error: oError } = await supabase.from('organizations').select('*');
  if (oError) {
    console.error('Error fetching organizations:', oError);
  } else {
    orgs.forEach(o => {
      console.log(`Org ID: ${o.id}, Name: ${o.name}, Slug: ${o.slug}`);
    });
  }

  console.log('\n--- BRANCHES ---');
  const { data: branches, error: bError } = await supabase.from('branches').select('*');
  if (bError) {
    console.error('Error fetching branches:', bError);
  } else {
    branches.forEach(b => {
      console.log(`Branch ID: ${b.id}, Name: ${b.name}, Org: ${b.org_id}`);
    });
  }

  console.log('\n--- ALL PROFILES IN DATABASE ---');
  const { data: allProfiles, error: apError } = await supabase
    .from('profiles')
    .select('*, organizations(name, slug)');
  if (apError) {
    console.error('Error fetching all profiles:', apError);
  } else {
    allProfiles.forEach(p => {
      console.log(`Profile ID: ${p.id}, user_id: ${p.user_id}, Name: ${p.name}, Org: ${p.org_id} (${p.organizations?.name}), Email: ${p.email}`);
    });
  }

  console.log('\n--- ALL USERS IN PUBLIC.USERS ---');
  const { data: publicUsers, error: puError } = await supabase.from('users').select('*');
  if (puError) {
    console.error('Error fetching public users:', puError);
  } else {
    publicUsers.forEach(u => {
      console.log('Public User:', JSON.stringify(u, null, 2));
    });
  }

  console.log('\n--- ALL USERS IN AUTH.USERS ---');
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
  if (uError) {
    console.error('Error fetching auth users:', uError);
  } else {
    users.forEach(u => {
      console.log(`Auth User ID: ${u.id}, Email: ${u.email}`);
    });
  }
}

run();
