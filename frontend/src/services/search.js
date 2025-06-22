import { supabase } from '../supabaseClient'

export async function searchCourses(query, limit = 5) {
  if (!query || query.length < 3) return []

  const { data, error } = await supabase
    .from ('courses')
    .select('*')
    .or(`title.ilike.%${query}%,code.ilike.%${query}%`)
    .order('title', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Search error: ', error)
    return []
  }

  return data || []
}

export async function searchInstructors(query, limit = 5) {
  if (!query || query.length < 3) return []

  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Search error: ', error)
    return []
  }

  return data || []
}