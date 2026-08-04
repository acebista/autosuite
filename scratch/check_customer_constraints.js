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
  // Query details about constraints on the customers table
  const query = `
    SELECT
      conname AS constraint_name,
      pg_get_constraintdef(c.oid) AS constraint_definition
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'customers'::regclass;
  `;
  
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: query });
  if (error) {
    // If execute_sql is not available, we can query it another way or check the raw pg_constraint table via direct REST if possible.
    // Let's try querying pg_constraint table using standard select if pg_constraint is exposed, but usually it is not.
    // So let's fall back to trying to fetch a customer by phone number globally using service role to see if it exists.
    console.log("Could not run RPC query, trying to search for phone number in customers using service role key...");
    const testPhone = '9849209128'; // from the earlier check
    console.log("Searching for sample phone " + testPhone);
    const { data: searchData, error: searchError } = await supabase
      .from('customers')
      .select('*');
    if (searchError) {
      console.error(searchError);
    } else {
      console.log(`Total customers globally: ${searchData.length}`);
      console.log('Customers in DB:', searchData.map(c => ({ id: c.id, name: c.name, phone: c.phone, org_id: c.org_id })));
    }
  } else {
    console.log('Constraints:', data);
  }
}

run();
