import { config } from 'dotenv';
config({ path: '.env.local' });
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, REDSKY_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}
// Use provided REDSKY_KEY or fallback to the public one
const USED_REDSKY_KEY = REDSKY_KEY || 'ff457966e64d5e877fdbad070f276d18ecec4a01';
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
// …rest of file unchanged…
