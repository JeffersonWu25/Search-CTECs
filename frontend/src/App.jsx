import { useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [searchText, setSearchText] = useState('')
  const [courses, setCourses] = useState([])

  async function handleSearch() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .ilike('title', `%${searchText}%`)
      .order('title', { ascending: true })

    if (error) {
      console.error('Error fetching courses:', error)
    } else {
      setCourses(data)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>CTEC Search</h1>
      <input
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search courses..."
        style={{ padding: '0.5rem', marginRight: '0.5rem' }}
      />
      <button onClick={handleSearch} style={{ padding: '0.5rem' }}>Search</button>

      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            {course.code} - {course.title}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App