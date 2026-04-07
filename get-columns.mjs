import { createClient } from '@supabase/supabase-js';

const URL = 'https://aygacqxznkwbgpenpjtl.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2FjcXh6bmt3YmdwZW5wanRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjg4MDUsImV4cCI6MjA5MDgwNDgwNX0.Ho7fEDA_4twB_GD_u989oDzJmkGNuRekSbbTzpkqJOw';

const supabase = createClient(URL, KEY);

async function getTableStructure() {
  const tables = [
    'merchants',
    'merchant_branches',
    'profiles',
    'merchant_staff',
    'merchant_staff_branches'
  ];

  for (const table of tables) {
    console.log(`\n📋 Tabla: ${table}`);
    console.log('─'.repeat(50));
    
    try {
      // Try to get a row to see columns
      const { data, error } = await supabase
        .from(table)
        .select()
        .limit(0);
      
      if (error && error.code === 'PGRST116') {
        // No rows but column info might be in error
        console.log('✓ Tabla existe (vacía)');
      }

      // Try insert with empty object to get field validation error
      const { error: insertError } = await supabase
        .from(table)
        .insert([{}]);

      if (insertError) {
        console.log(`Error al insertar (Normal, para ver campos requeridos):`);
        console.log(`  ${insertError.message}`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

getTableStructure();
