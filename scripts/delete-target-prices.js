require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables. Please check your .env.local file.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTargetPrices() {
  try {
    const { data, error } = await supabase
      .from('target_prices')
      .delete()
      .select();

    if (error) throw error;

    console.log('Successfully deleted target prices:', data);
  } catch (error) {
    console.error('Error deleting target prices:', error.message);
    process.exit(1);
  }
}

deleteTargetPrices(); 