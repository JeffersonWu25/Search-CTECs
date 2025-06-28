import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import './Search.css'

export function SearchResults({ selectedCourses, selectedInstructors, selectedRequirements }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)
      
      try {
        let query = supabase
          .from('course_offerings')
          .select(`
            *,
            courses (*),
            instructors (*),
            ctec_reviews (*)
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

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) throw error
        
        // Filter by requirements on the frontend (since we don't have a requirements table)
        let filteredResults = data || []
        
        if (selectedRequirements.length > 0) {
          filteredResults = filteredResults.filter(offering => {
            const course = offering.courses
            if (!course) return false
            
            // Check course level requirements
            const courseLevel = course.code?.split('_').pop()?.split('-')[0]
            if (selectedRequirements.includes('100') && courseLevel?.startsWith('1')) return true
            if (selectedRequirements.includes('200') && courseLevel?.startsWith('2')) return true
            if (selectedRequirements.includes('300') && courseLevel?.startsWith('3')) return true
            if (selectedRequirements.includes('400') && courseLevel?.startsWith('4')) return true
            
            // Check school requirements (you might need to add school field to courses table)
            // For now, we'll just return true if no level requirements are selected
            return !['100', '200', '300', '400'].some(req => selectedRequirements.includes(req))
          })
        }
        
        setResults(filteredResults)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError('Failed to load search results')
      } finally {
        setLoading(false)
      }
    }

    if (selectedCourses.length > 0 || selectedInstructors.length > 0 || selectedRequirements.length > 0) {
      fetchResults()
    } else {
      setResults([])
    }
  }, [selectedCourses, selectedInstructors, selectedRequirements])

  const handleRetry = () => {
    // Trigger a re-fetch by updating the state
    setError(null)
    setLoading(true)
    // The useEffect will handle the actual fetch
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

  if (selectedCourses.length === 0 && selectedInstructors.length === 0 && selectedRequirements.length === 0) {
    return (
      <div className="search-results-container">
        <div className="empty-state">
          <h3>No filters applied</h3>
          <p>Select courses, instructors, or requirements to see CTEC reviews and ratings.</p>
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

  return (
    <div className="search-results-container">
      <div className="results-header">
        <h3>Search Results ({results.length})</h3>
        <p>
          Showing CTEC reviews for {selectedCourses.length} course(s), {selectedInstructors.length} instructor(s)
          {selectedRequirements.length > 0 && `, and ${selectedRequirements.length} requirement filter(s)`}
        </p>
      </div>
      
      <div className="results-list">
        {results.map((offering) => (
          <div key={offering.id} className="result-card">
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
              
              {offering.ctec_reviews && offering.ctec_reviews.length > 0 && (
                <div className="review-stats">
                  <div className="stat">
                    <span className="stat-label">Overall Rating:</span>
                    <span className="stat-value">
                      {(offering.ctec_reviews[0]?.overall_rating || 'N/A')}/5
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Workload:</span>
                    <span className="stat-value">
                      {(offering.ctec_reviews[0]?.workload || 'N/A')}/5
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Responses:</span>
                    <span className="stat-value">
                      {offering.response_count || 0}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="result-card-footer">
              <span className="offering-date">
                {new Date(offering.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}