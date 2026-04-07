import { createClient } from '@supabase/supabase-js';

const URL = 'https://aygacqxznkwbgpenpjtl.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2FjcXh6bmt3YmdwZW5wanRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyODgwNSwiZXhwIjoyMDkwODA0ODA1fQ.0IdgiNnRHfYCq8Ur3JvMxbb3fbTQTqMWqMHj7D1jZPo';

const supabase = createClient(URL, KEY);

async function inspectDirect() {
  console.log('🔍 Direct inspection of profile existing data:\n');
  
  const { data: profiles } = await supabase.from('profiles').select('*').limit(5);
  
  if (profiles && profiles.length > 0) {
    console.log('✅ Profiles table columns:');
    const cols = Object.keys(profiles[0]);
    cols.forEach(col => console.log(`   - ${col}`));
    console.log('\nSample row:');
    console.log(JSON.stringify(profiles[0], null, 2));
  }

  console.log('\n\nAttempting to read from other tables without select all:\n');

  // Try to get first row from each table - might help if they have data
  const tables = ['merchants', 'merchant_branches', 'merchant_staff', 'merchant_staff_branches'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select().limit(1);
    console.log(`${table}: ${error ? `❌ ${error.message}` : `✅ Can query`}`);
  }
}

inspectDirect();
