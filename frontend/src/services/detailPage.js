import { supabase } from '../supabaseClient'

export async function detailPageInfo(selectedId, limit=1){
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
    
    if (error) {
        console.error('Detail page info error: ', error)
        return []
    }
    return data || []
}