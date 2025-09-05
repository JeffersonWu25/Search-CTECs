import { useState, useEffect } from 'react'
import { searchOfferings } from '../../services/offerings'
import { OfferingCard } from './OfferingCard'
import './Search.css'

export function SearchResults({ selectedCourses, selectedInstructors, selectedRequirements }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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


  return (
    <div className="search-results-container">
      <div className="search-results-header">
        <h3>Search Results ({results.length})</h3>
        <p>
          Showing CTEC reviews for {selectedCourses.length} course(s), {selectedInstructors.length} instructor(s)
          {selectedRequirements.length > 0 && `, ${selectedRequirements.length} requirement(s)`}
        </p>
      </div>
      <div className="search-results-list">
        {results.map((offering) => (
          <OfferingCard
            key={offering.id}
            offering={offering}
            selectedCourses={selectedCourses}
            selectedInstructors={selectedInstructors}
            selectedRequirements={selectedRequirements}
          />
        ))}
      </div>
    </div>
  )
}