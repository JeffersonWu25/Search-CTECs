import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xmjsvrukngnwzqwxzfau.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtanN2cnVrbmdud3pxd3h6ZmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjY1MzUsImV4cCI6MjA2MDE0MjUzNX0.ZTIwqbRW6pMFkw3MTv4M7tvyOjl8ggoPKuYeFfnSjrk'

export const supabase = createClient(supabaseUrl, supabaseKey)