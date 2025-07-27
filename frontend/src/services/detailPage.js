import { supabase } from '../supabaseClient'

export async function detailPageInfo(selectedId) {
  try {
    
    const { data, error } = await supabase
      .from('course_offerings')
      .select(`
        *,
        courses (*),
        instructors (*),
        ctec_responses (
          *,
          ctec_questions (*)
        )
      `)
      .eq('id', selectedId)
      .single()
    
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