import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('./.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

// Test: try inserting a sale record without vehicle_id
async function testNullableVehicle() {
  const { data, error } = await supabase
    .from('sale_records')
    .insert([{
      customer_id: 'aaaaaaaa-0000-0000-0000-000000000000', // fake uuid - will fail FK but tells us about NOT NULL
      current_state: 'BOOKED',
      booking_amount: 50000,
      sale_price: 3899000,
    }])
    .select()
    .single();

  if (error) {
    // If error says "null value in column vehicle_id" -> migration not applied yet
    // If error says "violates foreign key constraint" on customer_id -> migration worked, vehicle_id is nullable now
    if (error.message.includes('vehicle_id') && error.message.includes('null')) {
      console.log('❌ vehicle_id is still NOT NULL — migration NOT applied yet');
    } else if (error.message.includes('customer_id') || error.message.includes('foreign key') || error.message.includes('violates')) {
      console.log('✓ vehicle_id IS nullable — migration was applied successfully!');
      console.log('  (FK error on customer_id is expected with fake UUID)');
    } else {
      console.log('Unknown error:', error.message);
    }
  } else {
    console.log('Inserted (unexpected):', data);
    // Clean up
    await supabase.from('sale_records').delete().eq('id', data.id);
  }
}

testNullableVehicle();
