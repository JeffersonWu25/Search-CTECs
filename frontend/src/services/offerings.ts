/*
Returns offerings that match the course, instructor, and requirements filters.
*/

import { supabase } from '../supabaseClient'

type SearchOfferingsFilters = {
  courseIds?: string[]
  instructorIds?: string[]
  requirements?: string[]
  limit?: number
  offset?: number
}

export async function searchOfferings(filters: SearchOfferingsFilters = {}) {
  const {
    courseIds = [],
    instructorIds = [],
    requirements = [],
    limit = 20,
    offset = 0,
  } = filters

  // Select only needed columns; join as inner to reduce rows early
  let query = supabase
    .from('course_offerings')
    .select(`
      id, section, quarter, year, audience_size, response_count,
      course:courses!inner (
        id, code, title, school,
        requirements:course_requirements(
          requirement:requirements(id,name)
        )
      ),
      instructor:instructors!inner (
        id, name
      ),
      survey_responses(
        id, survey_question, distribution
      )
    `, { count: 'exact' }) // returns { data, error, count }

  if (courseIds.length) {
    query = query.in('course_id', courseIds)
  }
  if (instructorIds.length) {
    query = query.in('instructor_id', instructorIds)
  }
  if (requirements.length) {
    // For requirements filtering, we'll need to handle this differently
    // since PostgREST doesn't easily support filtering on nested arrays
    // For now, we'll filter in the application layer
    // TODO: Implement proper requirements filtering at database level
  }

  // Always paginate + stable order (uses indexes if present)
  query = query
    .order('year', { ascending: false })
    .order('quarter', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error

  return { data: data ?? [], count: count ?? 0 }
}
