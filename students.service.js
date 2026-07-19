// ============================================================
// Zolyn — Students service
// ============================================================

import { supabase } from './supabaseClient.js';

/**
 * Get all students for a school, with their class name.
 */
export async function getStudents(schoolId, classFilter = null) {
  let query = supabase
    .from('students')
    .select('id, full_name, admission_no, class_id, passport_url, guardian_name, guardian_phone, guardian_email, status, classes(name)')
    .eq('school_id', schoolId)
    .order('full_name', { ascending: true });

  if (classFilter) query = query.eq('class_id', classFilter);

  const { data, error } = await query;
  if (error) return { error };
  return { students: data };
}

/**
 * Create a new student.
 */
export async function createStudent(schoolId, studentData) {
  const { data, error } = await supabase
    .from('students')
    .insert({
      school_id: schoolId,
      full_name: studentData.fullName,
      admission_no: studentData.admissionNo || null,
      class_id: studentData.classId || null,
      guardian_name: studentData.guardianName || null,
      guardian_phone: studentData.guardianPhone || null,
      guardian_email: studentData.guardianEmail || null,
    })
    .select()
    .single();

  if (error) return { error };
  return { student: data };
}

/**
 * Update a student's details, including moving them to a different class.
 */
export async function updateStudent(studentId, studentData) {
  const { data, error } = await supabase
    .from('students')
    .update({
      full_name: studentData.fullName,
      admission_no: studentData.admissionNo || null,
      class_id: studentData.classId || null,
      guardian_name: studentData.guardianName || null,
      guardian_phone: studentData.guardianPhone || null,
      guardian_email: studentData.guardianEmail || null,
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) return { error };
  return { student: data };
}

/**
 * Change a student's status (e.g. mark as withdrawn or graduated).
 */
export async function setStudentStatus(studentId, status) {
  const { data, error } = await supabase
    .from('students')
    .update({ status })
    .eq('id', studentId)
    .select()
    .single();

  if (error) return { error };
  return { student: data };
}

/**
 * Permanently delete a student record.
 */
export async function deleteStudent(studentId) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  if (error) return { error };
  return { success: true };
}
