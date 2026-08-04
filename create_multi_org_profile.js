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
  const email = 'ace.bista+sarva@gmail.com';
  const realUserId = '0a42d281-0531-4758-8462-00b6faf57319';
  const sarvaOrgId = '3eb655a1-872f-4bff-8067-8fc62ef50b89';

  console.log(`Checking if user ${email} already exists...`);
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  let dummyUser = users.find(u => u.email === email);
  if (!dummyUser) {
    console.log(`Creating user ${email}...`);
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'Sachu123!',
      email_confirm: true
    });
    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    dummyUser = userData.user;
    console.log(`User created with ID: ${dummyUser.id}`);
  } else {
    console.log(`User already exists with ID: ${dummyUser.id}`);
  }

  console.log('Inserting profile for Sarva Motors...');
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: dummyUser.id,
      user_id: realUserId,
      email: 'ace.bista@gmail.com',
      name: 'Binod Chandra Bista',
      role: 'admin',
      org_id: sarvaOrgId,
      status: 'Active',
      is_active: false
    })
    .select();

  if (profileError) {
    console.error('Error inserting profile:', profileError);
  } else {
    console.log('Profile inserted successfully:', profileData);
  }
}

run();
