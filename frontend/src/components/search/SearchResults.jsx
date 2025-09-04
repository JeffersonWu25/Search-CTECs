import { useState, useEffect } from 'react'
import { searchOfferings } from '../../services/offerings'
import { useNavigate } from 'react-router-dom'
import './Search.css'

export function SearchResults({ selectedCourses, selectedInstructors, selectedRequirements }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchResults = async () => {
      if (selectedCourses.length === 0 && selectedInstructors.length === 0) {
        setResults([])
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const filters = {
          courseIds: selectedCourses.map(course => course.id),
          instructorIds: selectedInstructors.map(instructor => instructor.id),
          requirements: selectedRequirements,
          limit: 10,
          offset: 0
        }

        const result = await searchOfferings(filters)
        
        // Filter results by requirements if any are selected
        let filteredResults = result.data
        if (selectedRequirements.length > 0) {
          filteredResults = result.data.filter(offering => {
            // Unwrap the nested requirements structure
            const courseRequirements = offering.course?.requirements || []
            const unwrappedRequirements = courseRequirements.map(req => req.requirement).filter(Boolean)
            const requirementIds = unwrappedRequirements.map(req => req.id)
            
            return selectedRequirements.some(selectedReqId => 
              requirementIds.includes(selectedReqId)
            )
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

    fetchResults()
  }, [selectedCourses, selectedInstructors, selectedRequirements])

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
          {selectedRequirements.length > 0 && `, ${selectedRequirements.length} requirement(s)`}
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
              <h4>{offering.course?.title || 'Unknown Course'}</h4>
              <span className="course-code">
                {offering.course?.code || 'N/A'}
              </span>
            </div>
            <div className="result-card-content">
              <div className="offering-info">
                <div className="instructor-info">
                  <strong>Instructor:</strong> {offering.instructor?.name || 'Unknown'}
                </div>
                <div className="term-info">
                  <strong>Term:</strong> {offering.quarter} {offering.year}
                </div>
              </div>
            </div>
            <div className="result-card-footer">
              <span className="click-hint">Click to view details →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}