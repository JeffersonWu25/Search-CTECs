import { supabase } from '../supabaseClient'

export async function searchOfferings(filters = {}) {
  try {
    // Build base query
    let query = supabase
      .from('course_offerings')
      .select(`
        *,
        courses (*),
        instructors (*)
      `)

    // Filter by selected courses
    if (filters.courseIds?.length > 0) {
      query = query.in('course_id', filters.courseIds)
    }

    // Filter by selected instructors
    if (filters.instructorIds?.length > 0) {
      query = query.in('instructor_id', filters.instructorIds)
    }

    const { data, error } = await query

    if (error) {
      console.error('Search offerings error:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Search offerings failed:', error)
    throw error
  }
} 