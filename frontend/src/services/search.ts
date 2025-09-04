/*
This is the service that is used to search for courses and instructors.
*/

import { supabase } from '../supabaseClient'

function sanitizeForOr(value: string) {
  // PostgREST logic strings are picky: commas and parentheses are parsed as syntax.
  // Also strip %/* so we control wildcards explicitly.
  return value.trim().replace(/[()%*,]/g, ' ')
}

export async function searchCourses(query: string, limit = 5) {
  if (!query || query.trim().length < 2) return []

  const q = sanitizeForOr(query)
  const { data, error } = await supabase
    .from('courses')
    .select('id, code, title, school')
    .or(`title.ilike.%${q}%,code.ilike.%${q}%`)
    .order('title', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Search courses error:', error)
    return []
  }
  return data ?? []
}

export async function searchInstructors(query: string, limit = 5) {
  if (!query || query.trim().length < 2) return []

  const q = sanitizeForOr(query)
  const { data, error } = await supabase
    .from('instructors')
    .select('id, name')
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Search instructors error:', error)
    return []
  }
  return data ?? []
}
