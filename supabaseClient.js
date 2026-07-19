// ============================================================
// Zolyn — Supabase client
// Loaded once, imported everywhere else in the app.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://esagpcbgrqqcdgvfvefm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYWdwY2JncnFxY2RndmZ2ZWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MjAwNTksImV4cCI6MjA5OTk5NjA1OX0.-YvS23Ed-Dv8xh4WJHds_jcWKT13Zjo5rrUgKm36Ewc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
