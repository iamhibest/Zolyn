// ============================================================
// Zolyn — Membership service
// School Admin / Teacher Admin approving teacher join requests,
// plus fetching a school's active staff roster.
// ============================================================

import { supabase } from './supabaseClient.js';

/**
 * Get pending join requests for a school, with the requester's profile info.
 */
export async function getPendingRequests(schoolId) {
  const { data, error } = await supabase
    .from('school_membership_requests')
    .select('id, user_id, status, created_at, user_profiles(full_name, phone)')
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) return { error };
  return { requests: data };
}

/**
 * Approve or reject a membership request. Approval automatically
 * activates the teacher's access via a Postgres trigger.
 */
export async function reviewMembershipRequest(requestId, decision) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'You must be logged in.' } };

  const status = decision === 'approve' ? 'approved' : 'rejected';

  const { data, error } = await supabase
    .from('school_membership_requests')
    .update({ status, reviewed_by: user.id })
    .eq('id', requestId)
    .select()
    .single();

  if (error) return { error };
  return { request: data };
}

/**
 * Get active staff roster for a school (school_admin + teacher_admin + teacher).
 */
export async function getSchoolStaff(schoolId) {
  const { data, error } = await supabase
    .from('school_members')
    .select('id, user_id, role, status, permissions, created_at, user_profiles(full_name, phone)')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) return { error };
  return { staff: data };
}

/**
 * Promote a teacher to Teacher Admin, or create/update permissions.
 * Callable by School Admin or existing Teacher Admin (enforced by RLS).
 */
export async function setMemberRole(memberId, role, permissions = {}) {
  const { data, error } = await supabase
    .from('school_members')
    .update({ role, permissions })
    .eq('id', memberId)
    .select()
    .single();

  if (error) return { error };
  return { member: data };
}

/**
 * Remove a member from a school (soft — sets status to 'removed').
 * RLS enforces that a teacher_admin can never remove a school_admin.
 */
export async function removeMember(memberId) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('school_members')
    .update({ status: 'removed', removed_by: user?.id })
    .eq('id', memberId)
    .select()
    .single();

  if (error) return { error };
  return { member: data };
}
