// ============================================================
// Zolyn — Subjects service
// ============================================================

import { supabase } from './supabaseClient.js';

/**
 * Get all subjects for a school.
 */
export async function getSubjects(schoolId) {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, created_at')
    .eq('school_id', schoolId)
    .order('name', { ascending: true });

  if (error) return { error };
  return { subjects: data };
}

/**
 * Create a new subject.
 */
export async function createSubject(schoolId, name) {
  const { data, error } = await supabase
    .from('subjects')
    .insert({ school_id: schoolId, name })
    .select()
    .single();

  if (error) return { error };
  return { subject: data };
}

/**
 * Rename a subject.
 */
export async function updateSubject(subjectId, name) {
  const { data, error } = await supabase
    .from('subjects')
    .update({ name })
    .eq('id', subjectId)
    .select()
    .single();

  if (error) return { error };
  return { subject: data };
}

/**
 * Delete a subject. Will fail if results or teacher assignments still
 * reference it — intentional, prevents orphaning academic records.
 */
export async function deleteSubject(subjectId) {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId);

  if (error) return { error };
  return { success: true };
}
