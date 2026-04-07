import { createClient } from '@supabase/supabase-js';

const URL = 'https://aygacqxznkwbgpenpjtl.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2FjcXh6bmt3YmdwZW5wanRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyODgwNSwiZXhwIjoyMDkwODA0ODA1fQ.0IdgiNnRHfYCq8Ur3JvMxbb3fbTQTqMWqMHj7D1jZPo';

const supabase = createClient(URL, KEY);

const uuid = () => 'f' + Math.random().toString(16).slice(2).padEnd(31, '0').slice(0, 8) + 
             '-' + Math.random().toString(16).slice(2,6) + '-' + 
             '4' + Math.random().toString(16).slice(2,5) + '-' + 
             ('89ab'[Math.floor(Math.random()*4)]) + Math.random().toString(16).slice(2,5) + '-' + 
             Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12);

async function testInserts() {
  console.log('🧪 Testing insert requirements...\n');

  const id = uuid();
  
  // Test merchants
  console.log('📋 merchants');
  console.log('─'.repeat(60));
  const { error: mErr } = await supabase.from('merchants').insert([{ id, name: 'Test Biz' }]);
  if (mErr) console.log(`❌ ${mErr.message}`);
  else console.log('✅ Inserted: { id, name }');

  // Test merchant_branches  
  console.log('\n📋 merchant_branches');
  console.log('─'.repeat(60));
  const { error: bErr } = await supabase.from('merchant_branches').insert([{ 
    id: uuid(), 
    merchant_id: id,
    name: 'Branch 1',
    address: 'Test Address'
  }]);
  if (bErr) console.log(`❌ ${bErr.message}`);
  else console.log('✅ Inserted: { id, merchant_id, name, address }');

  // Test merchant_staff
  console.log('\n📋 merchant_staff');
  console.log('─'.repeat(60));
  const { error: sErr } = await supabase.from('merchant_staff').insert([{ 
    id: uuid(), 
    merchant_id: id,
    user_id: uuid(),
    role: 'owner'
  }]);
  if (sErr) console.log(`❌ ${sErr.message}`);
  else console.log('✅ Inserted: { id, merchant_id, user_id, role }');

  // Test merchant_staff_branches
  console.log('\n📋 merchant_staff_branches');
  console.log('─'.repeat(60));
  const { error: sbErr } = await supabase.from('merchant_staff_branches').insert([{ 
    id: uuid(), 
    merchant_staff_id: uuid(),
    branch_id: uuid(),
    role: 'owner'
  }]);
  if (sbErr) console.log(`❌ ${sbErr.message}`);
  else console.log('✅ Inserted: { id, merchant_staff_id, branch_id, role }');
}

testInserts();
