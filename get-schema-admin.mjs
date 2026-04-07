import { createClient } from '@supabase/supabase-js';

const URL = 'https://aygacqxznkwbgpenpjtl.supabase.co';
// Usar la service role key para bypass RLS y ver estructura
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2FjcXh6bmt3YmdwZW5wanRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyODgwNSwiZXhwIjoyMDkwODA0ODA1fQ.0IdgiNnRHfYCq8Ur3JvMxbb3fbTQTqMWqMHj7D1jZPo';

const supabase = createClient(URL, KEY);

async function getSchema() {
  const tables = [
    'merchants',
    'merchant_branches',
    'profiles',
    'merchant_staff',
    'merchant_staff_branches'
  ];

  for (const table of tables) {
    console.log(`\n📋 Tabla: ${table}`);
    console.log('═'.repeat(60));
    
    try {
      // Get any row to inspect columns
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`⚠️  ${error.message}`);
      } else if (Array.isArray(data) && data.length > 0) {
        const cols = Object.keys(data[0]);
        console.log(`✅ Columnas: ${cols.join(', ')}`);
        console.log(`✅ Datos (primera fila):`);
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log(`✅ Tabla existe (vacía)`);
        // Try inserting test data to see if validation gives us hints
        const testRow = { id: 'test-' + Date.now() };
        const { error: insertErr } = await supabase
          .from(table)
          .insert([testRow]);
        if (insertErr) {
          console.log(`📌 Insert error (helps identify required fields):`);
          console.log(`   ${insertErr.message}`);
        }
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
}

getSchema().catch(e => console.error('Fatal:', e));
