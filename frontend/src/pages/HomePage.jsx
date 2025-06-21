import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { supabase } from '../supabaseClient'

export function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [courses, setCourses] = useState([])

  async function handleSearch(query) {
    if (query.trim()) {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .ilike('title', `%${query}%`)
        .order('title', { ascending: true })

      if (error) {
        console.error('Error fetching courses:', error)
      } else {
        setCourses(data || [])
      }
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <Layout>
      <div className="homepage">
        <div className="hero">
          <h1 className="hero-title">CTEC Search</h1>
          <p className="hero-subtitle">Find your perfect course at Northwestern</p>
          
          <div className="search-section">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="input search-input"
            />
            <button 
              onClick={() => handleSearch(searchQuery)} 
              className="btn search-button"
            >
              Search
            </button>
          </div>
        </div>

        {courses.length > 0 && (
          <div className="results">
            <h2>Search Results</h2>
            <ul className="course-list">
              {courses.map((course) => (
                <li key={course.id} className="course-item">
                  {course.code} - {course.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  )
}