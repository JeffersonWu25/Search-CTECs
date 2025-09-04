import { useState } from 'react'
import { searchCourses, searchInstructors } from '../../services/search'
import './Search.css'

// Course requirements
const COURSE_REQUIREMENTS = [
  { id: 'distro', label: 'Distribution Requirements', options: [
    { id: 'a5103993-a0a8-41ff-b73c-702fc481e8c2', label: 'Formal Studies' },
    { id: 'natural_sciences', label: 'Natural Sciences' },
    { id: 'social_behavioral', label: 'Social & Behavioral Sciences' },
    { id: 'historical_studies', label: 'Historical Studies' },
    { id: 'ethics_values', label: 'Ethics & Values' },
    { id: 'literature_fine_arts', label: 'Literature & Fine Arts' }
  ]},
  { id: 'school', label: 'School Requirements', options: [
    { id: 'wcas', label: 'Weinberg College (WCAS)' },
    { id: 'mccormick', label: 'McCormick School of Engineering' },
    { id: 'medill', label: 'Medill School of Journalism' },
    { id: 'bienen', label: 'Bienen School of Music' },
    { id: 'soa', label: 'School of Communication' },
    { id: 'sps', label: 'School of Professional Studies' }
  ]},
  { id: 'level', label: 'Course Level', options: [
    { id: '100', label: '100-level (Introductory)' },
    { id: '200', label: '200-level (Intermediate)' },
    { id: '300', label: '300-level (Advanced)' },
    { id: '400', label: '400-level (Advanced/Seminar)' }
  ]}
]

export function CourseFilter({
  selectedCourses,
  selectedInstructors,
  selectedRequirements,
  onAddCourse,
  onRemoveCourse,
  onAddInstructor,
  onRemoveInstructor,
  onToggleRequirement,
  onClearFilters
}) {
  const [courseQuery, setCourseQuery] = useState('')
  const [instructorQuery, setInstructorQuery] = useState('')
  const [courseResults, setCourseResults] = useState([])
  const [instructorResults, setInstructorResults] = useState([])
  const [isSearchingCourses, setIsSearchingCourses] = useState(false)
  const [isSearchingInstructors, setIsSearchingInstructors] = useState(false)
  const [showCourseDropdown, setShowCourseDropdown] = useState(false)
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false)
  
  const handleCourseSearch = async (query) => {
    setCourseQuery(query)

    if (query.length < 2) {
      setCourseResults([])
      setShowCourseDropdown(false)
      return
    }

    setIsSearchingCourses(true)
    try {
      const results = await searchCourses(query)
      setCourseResults(results)
      setShowCourseDropdown(true)
    } catch (error) {
      console.error("Course search failed: ", error)
      setCourseResults([])
    } finally {
      setIsSearchingCourses(false)
    }
  }

  const handleInstructorSearch = async (query) => {
    setInstructorQuery(query)

    if (query.length < 2) {
      setInstructorResults([])
      setShowInstructorDropdown(false)
      return
    }

    setIsSearchingInstructors(true)
    try {
      const results = await searchInstructors(query)
      setInstructorResults(results)
      setShowInstructorDropdown(true)
    } catch (error) {
      console.error("Instructor search failed: ", error)
      setInstructorResults([])
    } finally {
      setIsSearchingInstructors(false)
    }
  }

  const handleCourseSelect = (item) => {
    onAddCourse(item)
    setCourseQuery("")
    setCourseResults([])
    setShowCourseDropdown(false)
  }

  const handleInstructorSelect = (item) => {
    onAddInstructor(item)
    setInstructorQuery("")
    setInstructorResults([])
    setShowInstructorDropdown(false)
  }

  const handleCourseRemove = (courseId) => {
    onRemoveCourse(courseId)
  }

  const handleInstructorRemove = (instructorId) => {
    onRemoveInstructor(instructorId)
  }

  return (
    <div className="course-filter">
      <h3 className="filter-title"> Search and Filter</h3>

      {/* Course Search */}
      <div className="search-section">
        <h4 className="search-section-title"> Search Courses </h4>
        <div className="search-container">

          {/* Course search input */}
          <div className="search-input-wrapper">
            <input type="text"
                  className="search-input"
                  placeholder='search courses'
                  value={courseQuery}
                  onChange={(e) => handleCourseSearch(e.target.value)}
                  onFocus={() => courseResults.length > 0 && setShowCourseDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCourseDropdown(false), 200)}
            />
            {isSearchingCourses && <div className="search-spinner"></div>}
          </div>


          {/* course search result dropdown */}
          {showCourseDropdown && courseResults.length > 0 && (
            <div className="search-dropdown">
              <ul className="search-results">
                {courseResults.map((course) => (
                  <li
                    key={`course-${course.id}`}
                    className='search-result-item'
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className='result-content'>
                      <div className='result-title'>{course.title}</div>
                      <div className='result-subtitle'>{course.code}</div>
                    </div>
                    <span className='result-type'>📚</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Selected Courses */}
        {selectedCourses.length > 0 && (
          <div className="selected-items">
            <h5>Selected Courses ({selectedCourses.length})</h5>
            <div className="selected-items-list">
              {selectedCourses.map((course) => (
                <div key={course.id} className="selected-item">
                  <div className="selected-item-info">
                    <div className="selected-item-title">{course.title}</div>
                    <div className="selected-item-subtitle">{course.code}</div>
                  </div>
                  <button
                    className="remove-item-btn"
                    onClick={() => handleCourseRemove(course.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* instructor search */}
      <div className="search-section">
        <h4 className="search-section-title">Instructor Search</h4>
        <div className="search-container">

          {/* Instructer search section search field */}
          <div className="search-input-wrapper">
            <input type="text"
              className="search-input"
              placeholder="search instructors"
              value={instructorQuery}
              onChange={(e)=> handleInstructorSearch(e.target.value)}
              onFocus={() => instructorResults.length > 0 && setShowInstructorDropdown(true)}
              onBlur={() => setTimeout(() => {setShowInstructorDropdown(false)}, 200)}
            />
            {isSearchingInstructors && <div className='search-spinner'></div>}
          </div>

          {/* Instructor dropdown section */}
          {showInstructorDropdown && instructorResults.length > 0 && (
            <div className='search-dropdown'>
              <ul className='search-results'>
                {instructorResults.map((instructor) => (
                  <li
                    key={`instructor-${instructor.id}`}
                    className="search-result-item"
                    onClick={() => handleInstructorSelect(instructor)}
                  >
                    <div className="result-content">
                      <div className="result-title">{instructor.name}</div>
                      <div className="result-subtitle">Instructor</div>
                    </div>
                    <span className='result-type'>👨‍🏫</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Selected instructors */}
        {selectedInstructors.length > 0 && (
          <div className="selected-items">
            <h5>Selected Instructors ({selectedInstructors.length})</h5>
            {selectedInstructors.map((instructor) => (
              <div key={instructor.id} className="selected-item">
                <div className="selected-item-info">
                  <div className="selected-item-title">{instructor.name}</div>
                  <div className="selected-item-subtitle">Instructor</div>
                </div>
                <button 
                  className="remove-item-btn"
                  onClick={() => handleInstructorRemove(instructor.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Requirements Filer */}
      <div className="requirements-filter">
        <h4 className='search-section-title'>Course Requirements</h4>
        {COURSE_REQUIREMENTS.map((category) => (
          <div key={category.id} className="requirement-category">
            <h5>{category.label}</h5>
            <div className="requirement-options">
              {category.options.map((option) => (
                <label key={option.id} className="requirement-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedRequirements.includes(option.id)}
                    onChange = {() => onToggleRequirement(option.id)}
                  />
                  <span className="checkbox-label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Clear filters button */}
      {(selectedCourses.length > 0 || selectedInstructors.length > 0 || selectedRequirements.length > 0) && (
        <div className="clear-filters">
          <button onClick={onClearFilters} className="clear-filters-btn">
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}
