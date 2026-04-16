const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testInsert() {
  // First login as Jessica to simulate her token
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'jessica@ligare.com', // wait I don't know her email
  });
  console.log(auth);
}

testInsert();
