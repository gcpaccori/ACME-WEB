import { createClient } from '@supabase/supabase-js';

const URL = 'https://aygacqxznkwbgpenpjtl.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2FjcXh6bmt3YmdwZW5wanRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjg4MDUsImV4cCI6MjA5MDgwNDgwNX0.Ho7fEDA_4twB_GD_u989oDzJmkGNuRekSbbTzpkqJOw';

const supabase = createClient(URL, KEY);

async function checkSchema() {
  console.log('🔍 Verificando esquema de tablas...\n');
  
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
        console.log(`✅ ${table}`);
        if (Array.isArray(data) && data.length > 0) {
          const cols = Object.keys(data[0]);
          console.log(`   Columnas: ${cols.join(', ')}`);
          console.log(`   Datos: ${JSON.stringify(data[0], null, 2)}`);
        } else {
          console.log(`   (sin datos, pero tabla existe)`);
        }
        console.log('');
      }
    } catch (e) {
      console.log(`❌ ${table}: Error - ${e.message}\n`);
    }
  }
}

checkSchema().catch(e => console.error('Error fatal:', e));
