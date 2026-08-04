import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import crypto from 'crypto';

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
  const sarvaOrgId = '3eb655a1-872f-4bff-8067-8fc62ef50b89';
  const userId = '0a42d281-0531-4758-8462-00b6faf57319';
  const profileId = crypto.randomUUID();

  console.log(`Inserting profile with ID ${profileId} for Sarva Motors...`);
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: profileId,
      name: 'Binod Chandra Bista',
      email: 'ace.bista@gmail.com',
      role: 'admin',
      org_id: sarvaOrgId,
      status: 'Active',
      user_id: userId,
      is_active: false
    })
    .select();

  if (error) {
    console.error('Error inserting profile:', error);
  } else {
    console.log('Profile inserted successfully:', data);
  }
}

run();
