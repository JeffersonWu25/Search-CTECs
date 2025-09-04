import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { CourseFilter } from '../components/search/CourseFilter'
import { SearchResults } from '../components/search/SearchResults'
import '../App.css'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCourses, setSelectedCourses] = useState([])
  const [selectedInstructors, setSelectedInstructors] = useState([])
  const [selectedRequirements, setSelectedRequirements] = useState([])

  // Read URL parameters and pre-populate filters
  useEffect(() => {
    const selectedType = searchParams.get('selectedType')
    const selectedId = searchParams.get('selectedId')
    const selectedTitle = searchParams.get('selectedTitle')
    const selectedCode = searchParams.get('selectedCode')
    const requirements = searchParams.get('requirements')

    if (selectedType && selectedId && selectedTitle) {
      if (selectedType === 'course') {
        const course = {
          id: selectedId,
          title: selectedTitle,
          code: selectedCode || ''
        }
        setSelectedCourses([course])
      } else if (selectedType === 'instructor') {
        const instructor = {
          id: selectedId,
          name: selectedTitle
        }
        setSelectedInstructors([instructor])
      }
    }

    // Restore requirements from URL
    if (requirements) {
      try {
        const reqArray = JSON.parse(decodeURIComponent(requirements))
        setSelectedRequirements(reqArray)
      } catch (e) {
        console.warn('Failed to parse requirements from URL:', e)
      }
    }
  }, [searchParams])

  // Update URL when requirements change
  useEffect(() => {
    if (selectedRequirements.length > 0) {
      const params = new URLSearchParams(searchParams)
      params.set('requirements', encodeURIComponent(JSON.stringify(selectedRequirements)))
      setSearchParams(params, { replace: true })
    } else {
      const params = new URLSearchParams(searchParams)
      params.delete('requirements')
      setSearchParams(params, { replace: true })
    }
  }, [selectedRequirements, searchParams, setSearchParams])

  const handleAddCourse = (course) => {
    if (!selectedCourses.find(c => c.id === course.id)) {
      setSelectedCourses([...selectedCourses, course])
    }
  }

  const handleRemoveCourse = (courseId) => {
    setSelectedCourses(selectedCourses.filter(c => c.id !== courseId))
  }

  const handleAddInstructor = (instructor) => {
    if (!selectedInstructors.find(i => i.id === instructor.id)) {
      setSelectedInstructors([...selectedInstructors, instructor])
    }
  }

  const handleRemoveInstructor = (instructorId) => {
    setSelectedInstructors(selectedInstructors.filter(i => i.id !== instructorId))
  }

  const handleToggleRequirement = (requirementId) => {
    setSelectedRequirements(prev => 
      prev.includes(requirementId)
        ? prev.filter(id => id !== requirementId)
        : [...prev, requirementId]
    )
  }

  const handleClearFilters = () => {
    setSelectedCourses([])
    setSelectedInstructors([])
    setSelectedRequirements([])
  }

  return (
    <Layout>
      <div className="search-page">
        <div className="search-container">
          <div className="filters-sidebar">
            <CourseFilter
              selectedCourses={selectedCourses}
              selectedInstructors={selectedInstructors}
              selectedRequirements={selectedRequirements}
              onAddCourse={handleAddCourse}
              onRemoveCourse={handleRemoveCourse}
              onAddInstructor={handleAddInstructor}
              onRemoveInstructor={handleRemoveInstructor}
              onToggleRequirement={handleToggleRequirement}
              onClearFilters={handleClearFilters}
            />
          </div>
          <div className="results-main">
            <SearchResults 
              selectedCourses={selectedCourses}
              selectedInstructors={selectedInstructors}
              selectedRequirements={selectedRequirements}
            />
          </div>
        </div>
      </div>
    </Layout>
  )
}