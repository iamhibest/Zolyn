// ============================================================
// Zolyn — Auth module
// Handles Gmail+password signup/login, session retrieval,
// and logout. Role/school detection lives in rbac.js — this
// file only deals with *identity*, not *access*.
// ============================================================

import { supabase } from './supabaseClient.js';

/**
 * Sign up a new user with email + password.
 * Only Gmail addresses are accepted, per product requirement.
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 * @returns {Promise<{user, session}|{error}>}
 */
export async function signUp(email, password, fullName) {
  if (!isGmailAddress(email)) {
    return { error: { message: 'Please sign up with a Gmail address.' } };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) return { error };
  return { user: data.user, session: data.session };
}

/**
 * Log in an existing user with email + password.
 */
export async function logIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error };
  return { user: data.user, session: data.session };
}

/**
 * Log out the current user.
 */
export async function logOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session (null if not logged in).
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { error };
  return { session: data.session };
}

/**
 * Get the current authenticated user (null if not logged in).
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return { error };
  return { user: data.user };
}

/**
 * Subscribe to auth state changes (login, logout, token refresh).
 * Returns an unsubscribe function.
 * @param {(event: string, session: object|null) => void} callback
 */
export function onAuthStateChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => listener.subscription.unsubscribe();
}

/**
 * Send a password reset email.
 */
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password.html`,
  });
  return { error };
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function isGmailAddress(email) {
  return /^[^\s@]+@gmail\.com$/i.test(email.trim());
}
