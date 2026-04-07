import { createClient } from '@supabase/supabase-js';

const URL = 'https://aygacqxznkwbgpenpjtl.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2FjcXh6bmt3YmdwZW5wanRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyODgwNSwiZXhwIjoyMDkwODA0ODA1fQ.0IdgiNnRHfYCq8Ur3JvMxbb3fbTQTqMWqMHj7D1jZPo';

const supabase = createClient(URL, KEY);

async function getColumnsInfo() {
  const tables = ['merchants', 'merchant_branches', 'merchant_staff', 'merchant_staff_branches'];

  for (const tableName of tables) {
    console.log(`\n📋 ${tableName.toUpperCase()}`);
    console.log('─'.repeat(70));
    
    try {
      const { data, error } = await supabase.rpc('get_columns', { 
        schema_name: 'public',
        table_name: tableName 
      });

      if (error) {
        // Try alternate method - insert one row with minimal data
        const testId = '00000000-0000-0000-0000-000000000001';
        const { error: err } = await supabase
          .from(tableName)
          .insert([{ id: testId }]);
        
        console.log(`  Attempting insert with id=${testId}:`);
        if (err?.message.includes('not-null')) {
          console.log(`  ⚠️  Required fields detected: ${err.message}`);
        } else {
          console.log(`  Error: ${err?.message || 'Unknown'}`);
        }
      } else {
        console.log('✅ Columns found (via RPC):');
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

getColumnsInfo();
