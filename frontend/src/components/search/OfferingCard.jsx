import { useNavigate } from 'react-router-dom'
import { 
  processSurveyResponses, 
  getRatingColorClass 
} from '../../utils/ratingCalculations'

export function OfferingCard({ offering, selectedCourses, selectedInstructors, selectedRequirements }) {
  const navigate = useNavigate()

  const handleResultClick = () => {
    // Preserve current search state in URL when navigating to detail page
    const currentParams = new URLSearchParams(window.location.search)
    const searchState = {
      selectedCourses,
      selectedInstructors,
      selectedRequirements
    }
    
    // Add search state to URL parameters
    currentParams.set('searchState', encodeURIComponent(JSON.stringify(searchState)))
    navigate(`/offering/${offering.id}?${currentParams.toString()}`)
  }

  const ratings = processSurveyResponses(offering.survey_responses)

  return (
    <div 
      className="search-course-card"
      onClick={handleResultClick}
    >
      {/* Header */}
      <div className="search-course-card-header">
        <div className="search-course-title">
          {offering.course?.title || 'Unknown Course'}
        </div>
        <div className="search-course-code">
          {offering.course?.code || 'N/A'}
        </div>
      </div>

      {/* Course Info */}
      <div className="search-course-info">
        <div className="search-instructor">
          {offering.instructor?.name || 'Unknown Instructor'}
        </div>
        <div className="search-term">
          {offering.quarter} {offering.year}
        </div>
      </div>

      {/* Ratings */}
      <div className="search-course-ratings">
        <div className="search-rating">
          <div className="search-rating-label">Overall</div>
          <div className={`search-rating-score ${getRatingColorClass(ratings.rating_of_course)}`}>
            {ratings.rating_of_course > 0 ? `${ratings.rating_of_course}/6` : '—'}
          </div>
        </div>
        <div className="search-rating">
          <div className="search-rating-label">Hours/Week</div>
          <div className={`search-rating-score ${getRatingColorClass(ratings.time_survey)}`}>
            {ratings.time_survey || '—'}
          </div>
        </div>
        <div className="search-rating">
          <div className="search-rating-label">Teaching</div>
          <div className={`search-rating-score ${getRatingColorClass(ratings.rating_of_instruction)}`}>
            {ratings.rating_of_instruction > 0 ? `${ratings.rating_of_instruction}/6` : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
