/*
This is the hook handles the data retreival for the homepage search for courses and instructors.
*/

import { useState, useEffect, useCallback } from 'react'
import { searchCourses, searchInstructors } from '../services/search'
import { useNavigate } from 'react-router-dom'

export function useSearch() {
  const [query, setQuery] = useState('') // search bar input
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()
  
  // Debounce utility function
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const debouncedSearch = useCallback(
    // delay execution to every 300 ms
    debounce(async (searchQuery) => {

      // input too short
      if (!searchQuery || searchQuery.length < 2) {
        setResults([])
        setShowDropdown(false)
        return
      }

      // input long enough
      setLoading(true)
      try {
        const [courses, instructors] = await Promise.all([
          searchCourses(searchQuery),
          searchInstructors(searchQuery),
        ])

        // combine into one list with types saved
        const combinedResults = [
          ...courses.map(course => ({ ...course, type: 'course' })),
          ...instructors.map(instructor => ({ ...instructor, type: 'instructor' })),
        ]

        setResults(combinedResults)
        setShowDropdown(combinedResults.length > 0)

      } catch (error) {
        console.error('Search error: ', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  // updates everytime query is changed
  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  // update query whever user types
  const handleInputChange = (value) => {
    setQuery(value)
    if (!value) {
      setShowDropdown(false)
    }
  }

  // handles when user clicks a dropdown item
  const handleResultSelect = (result) => {
    setQuery(result.type === 'course' ? result.title : result.name)
    setShowDropdown(false)
    
    // Pass the selected item data through URL parameters
    const params = new URLSearchParams()
    params.set('q', query)
    params.set('selectedType', result.type)
    params.set('selectedId', result.id)
    params.set('selectedTitle', result.type === 'course' ? result.title : result.name)
    params.set('selectedCode', result.type === 'course' ? result.code : '')
    
    navigate(`/search?${params.toString()}`)
  }

  // handles showing results when they exit
  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true)
    }
  }

  // delay closing dropdown when selected so click registers
  const handleInputBlur = () => {
    setTimeout(() => setShowDropdown(false), 200)
  }

  return {
    query,
    results,
    loading,
    showDropdown,
    handleInputChange,
    handleResultSelect,
    handleInputFocus,
    handleInputBlur
  }
}
