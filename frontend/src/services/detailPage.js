import { supabase } from '../supabaseClient'

export async function detailPageInfo(selectedId, limit = 1) {
  try {
    
    const { data, error } = await supabase
      .from('course_offerings')
      .select(`
        *,
        courses (*),
        instructors (*),
        ctec_responses (*)
      `)
      .eq('id', selectedId)
      .limit(limit)
    
    console.log('📊 Supabase response:', { data, error })
    
    if (error) {
      console.error('Detail page info error:', error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error('Detail page info failed:', error)
    throw error
  }
}