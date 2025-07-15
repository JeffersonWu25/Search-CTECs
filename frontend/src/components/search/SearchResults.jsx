import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useNavigate } from 'react-router-dom'
import './Search.css'

export function SearchResults({ selectedCourses, selectedInstructors }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)
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
        if (selectedCourses.length > 0) {
          const courseIds = selectedCourses.map(course => course.id)
          query = query.in('course_id', courseIds)
        }

        // Filter by selected instructors
        if (selectedInstructors.length > 0) {
          const instructorIds = selectedInstructors.map(instructor => instructor.id)
          query = query.in('instructor_id', instructorIds)
        }

        // Log the query for debugging
        console.log('Running Supabase query for course_offerings...')
        const { data, error } = await query
        console.log('Supabase query result:', { data, error })

        if (error) throw error

        setResults(data || [])
      } catch (err) {
        console.error('Error fetching results:', err)
        setError('Failed to load search results')
      } finally {
        setLoading(false)
      }
    }

    if (selectedCourses.length > 0 || selectedInstructors.length > 0) {
      fetchResults()
    } else {
      setResults([])
    }
  }, [selectedCourses, selectedInstructors])

  const handleRetry = () => {
    setError(null)
    setLoading(true)
  }

  if (loading) {
    return (
      <div className="search-results-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="search-results-container">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (selectedCourses.length === 0 && selectedInstructors.length === 0) {
    return (
      <div className="search-results-container">
        <div className="empty-state">
          <h3>No filters applied</h3>
          <p>Select courses or instructors to see CTEC reviews and ratings.</p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="search-results-container">
        <div className="empty-state">
          <h3>No results found</h3>
          <p>No CTEC reviews found for the selected filters.</p>
        </div>
      </div>
    )
  }

  const handleResultClick = (offering) => {
    navigate(`/offering/${offering.id}`)
  }

  return (
    <div className="search-results-container">
      <div className="results-header">
        <h3>Search Results ({results.length})</h3>
        <p>
          Showing CTEC reviews for {selectedCourses.length} course(s), {selectedInstructors.length} instructor(s)
        </p>
      </div>
      <div className="results-list">
        {results.map((offering) => (
          <div key={offering.id}
               className="result-card"
               onClick={() => handleResultClick(offering)}
               style={{ cursor: 'pointer' }}
          >
            <div className="result-card-header">
              <h4>{offering.courses?.title || 'Unknown Course'}</h4>
              <span className="course-code">
                {offering.courses?.code || 'N/A'}
              </span>
            </div>
            <div className="result-card-content">
              <div className="offering-info">
                <div className="instructor-info">
                  <strong>Instructor:</strong> {offering.instructors?.name || 'Unknown'}
                </div>
                <div className="term-info">
                  <strong>Term:</strong> {offering.quarter} {offering.year}
                </div>
              </div>
            </div>
            <div className="result-card-footer">
              <span className="offering-date">
                {offering.created_at ? new Date(offering.created_at).toLocaleDateString() : ''}
              </span>
              <span className="click-hint">Click to view details →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}