import { createClient } from '@supabase/supabase-js';

const URL = 'https://aygacqxznkwbgpenpjtl.supabase.co';
const KEY = 'sb_publishable_XIwU6kn9ugMbfTfWvta8n56';

const supabase = createClient(URL, KEY);

async function checkSchema() {
  const tables = [
    'merchants',
    'merchant_branches',
    'profiles',
    'merchant_staff',
    'merchant_staff_branches'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✓ ${table} exists`);
        if (data && data.length > 0) {
          console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
}

checkSchema();
