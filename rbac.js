// ============================================================
// Zolyn — RBAC module
// Determines what a logged-in user can see/do:
// - are they a super admin?
// - which school(s) are they an active member of, and what role?
// - do they have pending requests?
// This is UX routing only — the real enforcement is in Postgres
// RLS (see supabase/migrations/0003_rls_policies.sql). Never
// trust this module alone for security-sensitive decisions.
// ============================================================

import { supabase } from './supabaseClient.js';

/**
 * Full access snapshot for the current user. Call this once after
 * login/session-restore and cache it for the session.
 * @returns {Promise<{
 *   isSuperAdmin: boolean,
 *   memberships: Array<{school_id, role, status, permissions, school}>,
 *   pendingRequests: Array<{school_id, status}>
 * }>}
 */
export async function getAccessProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [superAdminRes, membershipsRes, requestsRes] = await Promise.all([
    supabase.from('super_admins').select('id').eq('id', user.id).maybeSingle(),
    supabase
      .from('school_members')
      .select('school_id, role, status, permissions, schools(id, name, status, logo_url)')
      .eq('user_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('school_membership_requests')
      .select('school_id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending'),
  ]);

  return {
    isSuperAdmin: !!superAdminRes.data,
    memberships: membershipsRes.data || [],
    pendingRequests: requestsRes.data || [],
  };
}

/**
 * Decide which dashboard a user should land on, given their access profile.
 * Returns a path relative to /dashboard/, or 'guest' if they have no active
 * membership anywhere yet.
 */
export function resolveLandingRoute(accessProfile) {
  if (!accessProfile) return 'index.html'; // not logged in

  if (accessProfile.isSuperAdmin) {
    return 'dashboard-super-admin.html';
  }

  if (accessProfile.memberships.length === 0) {
    return 'guest-home.html';
  }

  // If a user somehow belongs to multiple schools, default to the first
  // active one for now — a school switcher can be added later if needed.
  const primary = accessProfile.memberships[0];

  switch (primary.role) {
    case 'school_admin':
      return 'dashboard-school-admin.html';
    case 'teacher_admin':
      return 'dashboard-teacher-admin.html';
    case 'teacher':
      return 'dashboard-teacher.html';
    default:
      return 'guest-home.html';
  }
}

/**
 * Check whether the current user has a specific permission key
 * within a given school. school_admin implicitly has everything.
 * Mirrors the has_permission() Postgres function — kept in sync
 * for fast UI-level show/hide decisions (buttons, nav items).
 * @param {object} membership - one entry from accessProfile.memberships
 * @param {string} permKey - e.g. 'manage_students', 'enter_results'
 */
export function hasPermission(membership, permKey) {
  if (!membership) return false;
  if (membership.role === 'school_admin') return true;
  return !!membership.permissions?.[permKey];
}

/**
 * Guard for use at the top of every dashboard page. Redirects if the
 * user isn't allowed on that page. Call this before rendering anything.
 * @param {'super_admin'|'school_admin'|'teacher_admin'|'teacher'} requiredRole
 */
export async function requireRole(requiredRole) {
  const profile = await getAccessProfile();

  if (!profile) {
    window.location.href = 'index.html';
    return null;
  }

  if (requiredRole === 'super_admin') {
    if (!profile.isSuperAdmin) {
      window.location.href = resolveLandingRoute(profile);
      return null;
    }
    return profile;
  }

  const membership = profile.memberships.find((m) => m.role === requiredRole);
  if (!membership && !profile.isSuperAdmin) {
    window.location.href = resolveLandingRoute(profile);
    return null;
  }

  return profile;
}
