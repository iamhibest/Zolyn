// ============================================================
// Zolyn — Super Admin service
// Platform-level actions: approving/suspending schools, viewing
// all schools, platform-wide announcements.
// ============================================================

import { supabase } from './supabaseClient.js';

/**
 * Get all schools, optionally filtered by status.
 */
export async function getAllSchools(statusFilter = null) {
  let query = supabase
    .from('schools')
    .select('id, name, address, phone, status, subscription_status, created_at, logo_url')
    .order('created_at', { ascending: false });

  if (statusFilter) query = query.eq('status', statusFilter);

  const { data, error } = await query;
  if (error) return { error };
  return { schools: data };
}

/**
 * Approve a pending school registration.
 */
export async function approveSchool(schoolId) {
  const { data, error } = await supabase
    .from('schools')
    .update({ status: 'active' })
    .eq('id', schoolId)
    .select()
    .single();

  if (error) return { error };
  return { school: data };
}

/**
 * Suspend an active school.
 */
export async function suspendSchool(schoolId) {
  const { data, error } = await supabase
    .from('schools')
    .update({ status: 'suspended' })
    .eq('id', schoolId)
    .select()
    .single();

  if (error) return { error };
  return { school: data };
}

/**
 * Reactivate a suspended school.
 */
export async function reactivateSchool(schoolId) {
  const { data, error } = await supabase
    .from('schools')
    .update({ status: 'active' })
    .eq('id', schoolId)
    .select()
    .single();

  if (error) return { error };
  return { school: data };
}

/**
 * Basic platform stats for the Super Admin dashboard.
 */
export async function getPlatformStats() {
  const [schoolsRes, pendingRes, activeRes] = await Promise.all([
    supabase.from('schools').select('id', { count: 'exact', head: true }),
    supabase.from('schools').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    supabase.from('schools').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return {
    totalSchools: schoolsRes.count || 0,
    pendingSchools: pendingRes.count || 0,
    activeSchools: activeRes.count || 0,
  };
}

/**
 * Send a platform-wide announcement (school_id null = visible to everyone).
 */
export async function sendPlatformAnnouncement(title, message) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('notifications')
    .insert({ title, message, school_id: null, created_by: user?.id })
    .select()
    .single();

  if (error) return { error };
  return { notification: data };
}
