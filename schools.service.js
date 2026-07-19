// ============================================================
// Zolyn — Schools service
// All school-related Supabase calls live here. Pages call these
// functions; they never talk to supabase directly for this domain.
// ============================================================

import { supabase } from './supabaseClient.js';

/**
 * Register a new school. The signed-in user becomes its School Admin
 * automatically (handled by a Postgres trigger). The school itself
 * starts in 'pending_approval' status until the Super Admin approves it.
 */
export async function registerSchool({ name, address, phone }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'You must be logged in.' } };

  const { data, error } = await supabase
    .from('schools')
    .insert({ name, address, phone, created_by: user.id })
    .select()
    .single();

  if (error) return { error };
  return { school: data };
}

/**
 * Search active, approved schools by name (for the "join school" flow).
 * Only returns schools with status = 'active' — matches the public-read
 * RLS policy so guests can find real, approved schools to request to join.
 */
export async function searchSchools(query) {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, address, logo_url')
    .eq('status', 'active')
    .ilike('name', `%${query}%`)
    .limit(20);

  if (error) return { error };
  return { schools: data };
}

/**
 * Request to join a school as a teacher. Creates a pending row that
 * the school's admin-tier staff will review.
 */
export async function requestToJoinSchool(schoolId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'You must be logged in.' } };

  const { data, error } = await supabase
    .from('school_membership_requests')
    .insert({ school_id: schoolId, user_id: user.id })
    .select()
    .single();

  if (error) return { error };
  return { request: data };
}

/**
 * Get the current user's pending membership requests (so the UI can
 * show "request sent, awaiting approval" instead of the join button again).
 */
export async function getMyPendingRequests() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { requests: [] };

  const { data, error } = await supabase
    .from('school_membership_requests')
    .select('school_id, status')
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) return { error };
  return { requests: data };
}
