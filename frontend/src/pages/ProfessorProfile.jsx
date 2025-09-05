import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { OfferingCard } from '../components/search/OfferingCard'
import { 
  getRatingColorClass,
  calculateProfessorAverages
} from '../utils/ratingCalculations'

const API_BASE_URL = 'http://localhost:8000'

export function ProfessorProfile() {
  const navigate = useNavigate()
  const { selectedId } = useParams()
  const [professorData, setProfessorData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProfessorData = async () => {
      if (!selectedId) {
        setError('No instructor ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/instructors/${selectedId}/profile`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Instructor not found')
          } else {
            setError('Failed to load instructor profile')
          }
          return
        }

        const data = await response.json()
        setProfessorData(data)
      } catch (err) {
        console.log('Error fetching instructor profile: ', err)
        setError('Failed to load instructor profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfessorData()
  }, [selectedId])

  const handleBackToSearch = () => {
    navigate('/search')
  }

  if (loading) {
    return (
      <Layout>
        <div className="professor-profile-page">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading instructor profile...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !professorData) {
    return (
      <Layout>
        <div className="professor-profile-page">
          <div className="error-state">
            <h2>Error</h2>
            <p>{error || 'Instructor profile not found'}</p>
            <button onClick={handleBackToSearch} className='back-btn'>
              Back to Search
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // Calculate overall average ratings using the new function
  const overallRatings = calculateProfessorAverages(professorData)

  return (
    <Layout>
      <div className="professor-profile-page">
        {/* Header Section */}
        <div className="professor-header">
          <div className="professor-header-content">
            <div className="professor-photo-section">
              <div className="professor-photo">
                <img 
                  src={professorData.profile_photo_url} 
                  alt={professorData.name}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <div className="photo-placeholder" style={{display: 'none'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="professor-info-section">
              <h1 className="professor-name">{professorData.name}</h1>
              <div className="professor-details">
                <div className="professor-title">{professorData.title || 'Professor'}</div>
                <div className="professor-department">{professorData.department}</div>
                <div className="professor-contact">
                  <div className="contact-item">
                    <span className="contact-label">Email:</span>
                    <span className="contact-value">{professorData.email || 'N/A'}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Office:</span>
                    <span className="contact-value">{professorData.office || 'N/A'}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Office Hours:</span>
                    <span className="contact-value">{professorData.officeHours || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="professor-content">
          {/* Left Column - Professor Info & Ratings */}
          <div className="professor-left-column">
            {/* Overall Ratings Summary */}
            <div className="info-card">
              <h3>📊 Overall Teaching Ratings</h3>
              <div className="rating-summary-grid">
                <div className="summary-rating">
                  <div className="summary-rating-label">Overall Rating</div>
                  <div className={`summary-rating-score ${getRatingColorClass(overallRatings.rating_of_course)}`}>
                    {overallRatings.rating_of_course > 0 ? `${overallRatings.rating_of_course}/6` : '—'}
                  </div>
                </div>
                <div className="summary-rating">
                  <div className="summary-rating-label">Rating of Instruction</div>
                  <div className={`summary-rating-score ${getRatingColorClass(overallRatings.rating_of_instruction)}`}>
                    {overallRatings.rating_of_instruction > 0 ? `${overallRatings.rating_of_instruction}/6` : '—'}
                  </div>
                </div>
                <div className="summary-rating">
                  <div className="summary-rating-label">Estimated Learning</div>
                  <div className={`summary-rating-score ${getRatingColorClass(overallRatings.estimated_learning)}`}>
                    {overallRatings.estimated_learning > 0 ? `${overallRatings.estimated_learning}/6` : '—'}
                  </div>
                </div>
                <div className="summary-rating">
                  <div className="summary-rating-label">Intellectual Challenge</div>
                  <div className={`summary-rating-score ${getRatingColorClass(overallRatings.intellectual_challenge)}`}>
                    {overallRatings.intellectual_challenge > 0 ? `${overallRatings.intellectual_challenge}/6` : '—'}
                  </div>
                </div>
                <div className="summary-rating">
                  <div className="summary-rating-label">Stimulating Instructor</div>
                  <div className={`summary-rating-score ${getRatingColorClass(overallRatings.stimulating_instructor)}`}>
                    {overallRatings.stimulating_instructor > 0 ? `${overallRatings.stimulating_instructor}/6` : '—'}
                  </div>
                </div>
                <div className="summary-rating">
                  <div className="summary-rating-label">Hours/Week</div>
                  <div className={`summary-rating-score ${getRatingColorClass(overallRatings.time_survey)}`}>
                    {overallRatings.time_survey || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {professorData.ai_instructor_summary && (
              <div className="info-card">
                <h3>🤖 AI Summary</h3>
                <div className="ai-summary-content">
                  <p>{professorData.ai_instructor_summary}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Courses Taught */}
          <div className="professor-right-column">
            <div className="professor-courses-section">
              <div className="professor-section-header">
                <h3>📚 Courses Taught</h3>
                <span className="professor-course-count">{professorData.course_offerings.length} courses</span>
              </div>
              
              <div className="professor-courses-list">
                {professorData.course_offerings.map((offering) => (
                  <OfferingCard
                    key={offering.id}
                    offering={offering}
                    selectedCourses={[]}
                    selectedInstructors={[]}
                    selectedRequirements={[]}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
