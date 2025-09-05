import { useState, useEffect, useRef, useCallback } from 'react'
import { searchOfferings } from '../../services/offerings'
import { OfferingCard } from './OfferingCard'
import './Search.css'

export function SearchResults({ selectedCourses, selectedInstructors, selectedRequirements }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const sentinelRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Reset pagination state when filters change
  const resetPagination = useCallback(() => {
    setResults([])
    setCurrentOffset(0)
    setHasMore(true)
    setTotalCount(0)
    setError(null)
  }, [])

  // Filter results by requirements
  const filterResultsByRequirements = useCallback((data) => {
    if (selectedRequirements.length === 0) {
      return data
    }
    
    return data.filter(offering => {
      const courseRequirements = offering.course?.requirements || []
      const unwrappedRequirements = courseRequirements.map(req => req.requirement).filter(Boolean)
      const requirementIds = unwrappedRequirements.map(req => req.id)
      
      return selectedRequirements.some(selectedReqId => 
        requirementIds.includes(selectedReqId)
      )
    })
  }, [selectedRequirements])

  // Fetch initial results or reset when filters change
  const fetchInitialResults = useCallback(async () => {
    if (selectedCourses.length === 0 && selectedInstructors.length === 0) {
      resetPagination()
      return
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)
    resetPagination()
    
    try {
      const filters = {
        courseIds: selectedCourses.map(course => course.id),
        instructorIds: selectedInstructors.map(instructor => instructor.id),
        requirements: selectedRequirements,
        limit: 10,
        offset: 0
      }

      const result = await searchOfferings(filters)
      const filteredResults = filterResultsByRequirements(result.data)
      
      setResults(filteredResults)
      setTotalCount(result.count)
      setCurrentOffset(10)
      setHasMore(filteredResults.length === 10 && filteredResults.length < result.count)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching results:', err)
        setError('Failed to load search results')
      }
    } finally {
      setLoading(false)
    }
  }, [selectedCourses, selectedInstructors, selectedRequirements, filterResultsByRequirements, resetPagination])

  // Fetch more results for pagination
  const fetchMoreResults = useCallback(async () => {
    if (loadingMore || !hasMore) return

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    setLoadingMore(true)
    
    try {
      const filters = {
        courseIds: selectedCourses.map(course => course.id),
        instructorIds: selectedInstructors.map(instructor => instructor.id),
        requirements: selectedRequirements,
        limit: 10,
        offset: currentOffset
      }

      const result = await searchOfferings(filters)
      const filteredResults = filterResultsByRequirements(result.data)
      
      setResults(prevResults => [...prevResults, ...filteredResults])
      setCurrentOffset(prevOffset => prevOffset + 10)
      setHasMore(filteredResults.length === 10 && results.length + filteredResults.length < result.count)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching more results:', err)
        setError('Failed to load more results')
      }
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, selectedCourses, selectedInstructors, selectedRequirements, currentOffset, filterResultsByRequirements, results.length])

  // Initial fetch when filters change
  useEffect(() => {
    fetchInitialResults()
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchInitialResults])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !loadingMore && hasMore) {
          fetchMoreResults()
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before reaching the sentinel
        threshold: 0.1
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loadingMore, fetchMoreResults])

  const handleRetry = () => {
    setError(null)
    fetchInitialResults()
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
        <h3>Search Results ({results.length}{totalCount > 0 ? ` of ${totalCount}` : ''})</h3>
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
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="loading-more-state">
            <div className="loading-spinner"></div>
            <p>Loading more results...</p>
          </div>
        )}
        
        {/* End of results indicator */}
        {!hasMore && results.length > 0 && (
          <div className="end-of-results">
            <p>You've reached the end of the results</p>
          </div>
        )}
        
        {/* Sentinel element for intersection observer */}
        {hasMore && !loadingMore && (
          <div ref={sentinelRef} className="scroll-sentinel" />
        )}
      </div>
    </div>
  )
}