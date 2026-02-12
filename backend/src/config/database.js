const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env. Add them from Supabase Dashboard → Project Settings → API.'
  );
}
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

module.exports = { supabase };
