// ============================================================
// Zolyn — Classes service
// ============================================================

import { supabase } from './supabaseClient.js';

/**
 * Get all classes for a school, with student counts.
 */
export async function getClasses(schoolId) {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, class_teacher_id, created_at, students(count)')
    .eq('school_id', schoolId)
    .order('name', { ascending: true });

  if (error) return { error };

  // class_teacher_id references auth.users, not user_profiles directly,
  // so PostgREST can't auto-embed the name — fetch names separately
  // and merge them in, same pattern used to work around that limitation.
  const teacherIds = [...new Set((data || []).map(c => c.class_teacher_id).filter(Boolean))];
  let namesById = {};
  if (teacherIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', teacherIds);
    namesById = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
  }

  const classes = (data || []).map(c => ({
    ...c,
    teacher_name: c.class_teacher_id ? (namesById[c.class_teacher_id] || 'Unknown staff member') : null,
  }));

  return { classes };
}

/**
 * Create a new class.
 */
export async function createClass(schoolId, name, classTeacherId = null) {
  const { data, error } = await supabase
    .from('classes')
    .insert({ school_id: schoolId, name, class_teacher_id: classTeacherId || null })
    .select()
    .single();

  if (error) return { error };
  return { class: data };
}

/**
 * Rename a class and/or change its class teacher.
 */
export async function updateClass(classId, name, classTeacherId = null) {
  const { data, error } = await supabase
    .from('classes')
    .update({ name, class_teacher_id: classTeacherId || null })
    .eq('id', classId)
    .select()
    .single();

  if (error) return { error };
  return { class: data };
}

/**
 * Delete a class. Will fail if students are still assigned to it
 * (students.class_id has no cascade) — this is intentional, so a
 * school can't accidentally orphan students by deleting a class.
 */
export async function deleteClass(classId) {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) return { error };
  return { success: true };
}

/**
 * Get active teachers for a school, for the "class teacher" dropdown.
 */
export async function getSchoolTeachers(schoolId) {
  const { data, error } = await supabase
    .from('school_members')
    .select('user_id, user_profiles(full_name)')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .in('role', ['teacher', 'teacher_admin', 'school_admin']);

  if (error) return { error };
  return { teachers: data };
}
